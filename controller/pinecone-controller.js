// backend/controllers/pineconeController.js
import { initPinecone, getIndex } from "../utils/pinecone.js";
import { getEmbedding } from "../utils/gemini.js";
import Chunk from "../models/Chunk.js"; // Mongo model (optional storage)
import { v4 as uuidv4 } from "uuid";

await initPinecone(); // run at top-level when server starts (or here once)

export async function upsertChunksToPinecone(docId, chunks, userId) {
  const index = getIndex();
  // Pinecone upsert accepts batches; pick batch size e.g., 50
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    // create embeddings for all chunks in sequence (could parallelize but careful with rate limits)
    const upserts = [];
    for (const chunk of batch) {
      const embedding = await getEmbedding(chunk); // array of numbers
      const id = uuidv4();
      upserts.push({
        id,
        values: embedding,
        metadata: {
          docId: docId.toString(),
          userId: userId.toString ? userId.toString() : userId,
          content: chunk.slice(0, 500) // store truncated content for metadata; full content in Mongo if needed
        }
      });
      // optionally store chunk in Mongo too:
      await Chunk.create({
        docId,
        content: chunk,
        embedding // store embedding if you want redundancy
      });
    }
    await index.upsert({
      upsertRequest: {
        vectors: upserts,
        namespace: process.env.PINECONE_NAMESPACE || undefined
      }
    });
  }
  return true;
}
