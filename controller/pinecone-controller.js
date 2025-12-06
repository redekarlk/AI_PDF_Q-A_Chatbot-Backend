import { pinecone } from "../utils/pinecone-client.js";
import { embedText } from "../utils/gemini.js";
import { v4 as uuidv4 } from "uuid";

export async function upsertChunksToPinecone(docId, chunks, userId) {
  const index = pinecone.Index(process.env.PINECONE_INDEX || "pdf-rag");
  
  // Pinecone upsert accepts batches; pick batch size e.g., 100
  const BATCH_SIZE = 100;
  const EMBED_BATCH_SIZE = 5; // Parallel embedding requests

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const chunkBatch = chunks.slice(i, i + BATCH_SIZE);
    const vectors = [];

    // Process embeddings in smaller parallel batches to avoid rate limits
    for (let j = 0; j < chunkBatch.length; j += EMBED_BATCH_SIZE) {
      const embedBatch = chunkBatch.slice(j, j + EMBED_BATCH_SIZE);
      
      const promises = embedBatch.map(async (chunk) => {
        const embedding = await embedText(chunk, "document");
        return {
          id: uuidv4(),
          values: embedding,
          metadata: {
            docId: docId.toString(),
            userId: userId.toString(),
            content: chunk // Store full content for retrieval
          }
        };
      });

      const batchVectors = await Promise.all(promises);
      vectors.push(...batchVectors);
    }

    // Upsert the prepared batch of vectors to Pinecone
    if (vectors.length > 0) {
      await index.upsert(vectors);
    }
  }
  
  return true;
}
