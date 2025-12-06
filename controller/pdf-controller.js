import Document from "../model/pdf-model.js";
import { extractTextFromFile } from "../utils/file-loader.js";
import { chunkText } from "../utils/chunker.js";
import { embedText } from "../utils/gemini.js";
import { pinecone, verifyEmbeddingDimension, PINECONE_DIMENSION } from "../utils/pinecone-client.js";
import { getFileHash } from "../utils/hash.js";
import fs from "fs/promises";

export const uploadPDF = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // 1. Compute hash of uploaded PDF
    const hash = getFileHash(file.path);

    // 2. Check if this PDF already exists in DB for this user
    const existing = await Document.findOne({ userId, hash });

    if (existing) {
      // delete duplicate file
      await fs.unlink(file.path);

      return res.json({
        msg: "PDF already processed earlier",
        documentId: existing._id,
        title: existing.title,
        reused: true
      });
    }

    // 3. Create NEW document entry
    const doc = await Document.create({
      userId,
      title: file.originalname,
      filePath: file.path,
      hash
    });

    try {
      // 4. Extract text
      const text = await extractTextFromFile(file.path, file.mimetype);

      // 5. Chunk text
      const chunks = chunkText(text); // Uses improved chunker defaults

      // 6. Generate Embeddings (Batched for speed)
      const vectors = [];
      const EMBED_BATCH_SIZE = 5; // Process 5 chunks in parallel to speed up Gemini

      for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);

        // Run batch in parallel
        const batchPromises = batch.map(async (chunk, idx) => {
          const embedding = await embedText(chunk);

          // Verify dimension immediately
          verifyEmbeddingDimension(embedding);

          return {
            id: `${doc._id}-${i + idx}`,
            values: embedding,
            metadata: { docId: String(doc._id), content: chunk }
          };
        });

        const batchVectors = await Promise.all(batchPromises);
        vectors.push(...batchVectors);
      }

      // 7. Upsert to Pinecone (Batched for reliability)
      const index = pinecone.Index("pdf-rag");
      const UPSERT_BATCH_SIZE = 100; // Pinecone recommends batching upserts

      for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
        const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
        await index.upsert(batch);
      }

      // 8. Delete original PDF
      await fs.unlink(file.path);

      return res.json({
        msg: "PDF uploaded & processed successfully",
        documentId: doc._id,
        title: doc.title,
        totalChunks: chunks.length,
        reused: false
      });

    } catch (processError) {
      // ROLLBACK: If anything fails after doc creation, delete the doc from DB
      await Document.findByIdAndDelete(doc._id);

      // Re-throw to be caught by outer catch for generic error handling
      throw processError;
    }

  } catch (err) {
    // Ensure file is deleted even on error
    if (req.file?.path) {
      try { await fs.unlink(req.file.path); } catch (e) { /* ignore */ }
    }

    // Handle specific dimension errors if they bubbled up
    if (err.message && err.message.includes("dimension")) {
      return res.status(500).json({
        msg: "Embedding dimension mismatch",
        error: err.message,
        details: { expectedDimension: PINECONE_DIMENSION }
      });
    }

    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};
