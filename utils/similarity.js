export const cosineSimilarity = (vecA, vecB) => {
    let dot = 0, magA = 0, magB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};
