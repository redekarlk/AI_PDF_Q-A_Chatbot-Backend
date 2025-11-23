// import Document from "../model/pdf-model.js";
// import { extractTextFromPDF } from "../utils/pdf-loader.js";
// import { chunkText } from "../utils/chunker.js";

// import Chunk from "../model/chunk-model.js";
// import { embedText } from "../utils/gemini.js";


// export const uploadPDF = async (req, res) => {
//     try {
//         const userId = req.userId;  // from auth middleware
//         const file = req.file;

//         if (!file) {
//             return res.status(400).json({ msg: "No file uploaded" });
//         }

//         // Save document metadata
//         const doc = await Document.create({
//             userId,
//             title: file.originalname,
//             filePath: file.path
//         });

//         // Extract text from PDF
//         const text = await extractTextFromPDF(file.path);

//         // Chunk text
//         const chunks = chunkText(text);

//         // console.log(chunks);

//         // Save chunks with embeddings
//         for (const c of chunks) {
//             const embedding = await embedText(c);

//             await Chunk.create({
//                 docId: doc._id,
//                 content: c,
//                 embedding
//             });
//         }

//         console.log("Embeddings saved successfully");


//         res.json({
//             msg: "PDF uploaded & text extracted successfully",
//             documentId: doc._id,
//             totalChunks: chunks.length,
//             chunksPreview: chunks.slice(0, 3)
//         });

//     } catch (err) {
//         res.status(500).json({ msg: "Server error", error: err.message });
//     }
// };


// import Document from "../model/pdf-model.js";
// import { extractTextFromPDF } from "../utils/pdf-loader.js";
// import { chunkText } from "../utils/chunker.js";
// import { embedText } from "../utils/gemini.js";
// import { pinecone, verifyEmbeddingDimension, PINECONE_DIMENSION } from "../utils/pinecone-client.js";

// import fs from "fs/promises";

// export const uploadPDF = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const file = req.file;

//     if (!file) {
//       return res.status(400).json({ msg: "No file uploaded" });
//     }

    




//     // Save document metadata
//     const doc = await Document.create({
//       userId,
//       title: file.originalname,
//       filePath: file.path
//     });

//     // Extract text from PDF
//     const text = await extractTextFromPDF(file.path);

//     // Chunk text
//     const chunks = chunkText(text);

//     const index = pinecone.Index("pdf-rag");
//     const vectors = [];
//     let counter = 0;

//     for (const c of chunks) {
//       const embedding = await embedText(c);

//       // Verify embedding dimension early and return helpful error
//       try {
//         verifyEmbeddingDimension(embedding);
//       } catch (dimErr) {
//         return res.status(500).json({
//           msg: "Server error",
//           error: dimErr.message,
//           details: {
//             embeddingDimension: embedding?.length ?? null,
//             expectedDimension: PINECONE_DIMENSION,
//             suggestion: "Recreate your Pinecone index with the expected dimension or set PINECONE_DIMENSION to match your index."
//           }
//         });
//       }

//       vectors.push({
//         id: `${doc._id}-${counter}`,
//         values: embedding,
//         metadata: {
//           docId: doc._id.toString(),
//           content: c
//         }
//       });

//       counter++;
//     }

//     // Save in Pinecone (catch dimension mismatch and give actionable message)
//     try {
//       await index.upsert(vectors);

//       console.log("Embeddings saved successfully");

//       // DELETE THE PDF FILE after successful upsert
//       try {
//         await fs.unlink(file.path);
//         console.log(`Deleted uploaded PDF: ${file.path}`);
//       } catch (deleteErr) {
//         console.warn("Failed to delete PDF:", deleteErr.message);
//       }

//       res.json({
//         msg: "PDF uploaded and chunks stored in Pinecone",
//         documentId: doc._id,
//         totalChunks: chunks.length,
//         preview: chunks.slice(0, 3)
//       });
//     } catch (pineErr) {
//       // Detect dimension mismatch errors returned by Pinecone
//       const message = pineErr?.message || String(pineErr);
//       if (/dimension/i.test(message) || /does not match the dimension of the index/i.test(message)) {
//         // Attempt to extract numbers from the error message for clarity
//         const nums = message.match(/\d+/g) || [];
//         const embeddingDim = vectors[0]?.values?.length || null;
//         const indexDim = nums.length ? nums[nums.length - 1] : undefined;

//         return res.status(500).json({
//           msg: "Server error",
//           error: message,
//           details: {
//             embeddingDimension: embeddingDim,
//             indexDimension: indexDim,
//             suggestion: "Your Pinecone index has a different vector dimension than the embeddings produced by the model. Either recreate the Pinecone index with dimension 768 (recommended for Gemini text-embedding-004), or change the embedding model to one that produces the index's expected dimension."
//           }
//         });
//       }

//       // otherwise rethrow / return generic error
//       return res.status(500).json({ msg: "Server error", error: message });
//     }

//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };




import Document from "../model/pdf-model.js";
import { extractTextFromPDF } from "../utils/pdf-loader.js";
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

    // 👉 1. Compute hash of uploaded PDF
    const hash = getFileHash(file.path);

    // 👉 2. Check if this PDF already exists in DB for this user
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

    // 4. Extract text
    const text = await extractTextFromPDF(file.path);

    // 5. Chunk text
    const chunks = chunkText(text);

    // 6. Prepare Pinecone upsert
    const index = pinecone.Index("pdf-rag");
    const vectors = [];

    let counter = 0;
    for (const c of chunks) {
      const embedding = await embedText(c);

      try {
        verifyEmbeddingDimension(embedding);
      } catch (dimErr) {
        await fs.unlink(file.path); // cleanup
        return res.status(500).json({
          msg: "Embedding dimension mismatch",
          error: dimErr.message,
          details: {
            embeddingDimension: embedding?.length,
            expectedDimension: PINECONE_DIMENSION
          }
        });
      }

      vectors.push({
        id: `${doc._id}-${counter}`,
        values: embedding,
        metadata: { docId: String(doc._id), content: c }
      });

      counter++;
    }

    // 7. Upsert to Pinecone
    try {
      await index.upsert(vectors);
    } catch (pineErr) {
      const message = pineErr.message || String(pineErr);

      const embeddingDim = vectors[0]?.values?.length || null;

      return res.status(500).json({
        msg: "Pinecone error",
        error: message,
        details: {
          embeddingDimension: embeddingDim,
          expectedDimension: PINECONE_DIMENSION
        }
      });
    }

    //  8. Delete original PDF
    await fs.unlink(file.path);

    return res.json({
      msg: "PDF uploaded & processed successfully",
      documentId: doc._id,
      totalChunks: chunks.length,
      reused: false
    });

  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};
