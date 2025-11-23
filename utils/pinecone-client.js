// backend/utils/pinecone.js
// import { PineconeClient } from "@pinecone-database/pinecone";

// const pinecone = new PineconeClient();

// export async function initPinecone() {
//   await pinecone.init({
//     apiKey: process.env.PINECONE_API_KEY,
//     environment: process.env.PINECONE_ENVIRONMENT,
//   });
//   return pinecone;
// }

// export function getIndex(indexName = process.env.PINECONE_INDEX) {
//   return pinecone.Index(indexName);
// }


import { Pinecone } from "@pinecone-database/pinecone";

// Expected vector dimension for your Pinecone index
export const PINECONE_DIMENSION = parseInt(process.env.PINECONE_DIMENSION || "768", 10);

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export function verifyEmbeddingDimension(vec) {
  if (!Array.isArray(vec)) {
    throw new Error("Embedding must be an array of numbers");
  }
  const len = vec.length;
  if (len !== PINECONE_DIMENSION) {
    throw new Error(`Embedding dimension ${len} does not match expected dimension ${PINECONE_DIMENSION}`);
  }
  return true;
}
