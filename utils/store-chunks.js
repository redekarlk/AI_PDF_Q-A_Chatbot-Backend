import { pinecone } from "./pinecone.js";
import { getEmbedding } from "./gemini.js";

export const storeChunksInPinecone = async (docId, chunks) => {
  const index = pinecone.Index("pdf-rag");

  const vectors = [];

  let counter = 0;

  for (let content of chunks) {
    const embedding = await getEmbedding(content);

    vectors.push({
      id: `${docId}-${counter}`,
      values: embedding, 
      metadata: {
        docId,
        content
      }
    });

    counter++;
  }

  // Upsert into Pinecone in batches
  await index.upsert(vectors);

  return true;
};
