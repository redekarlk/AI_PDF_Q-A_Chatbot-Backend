import Chunk from "../model/chunk-model.js";
import History from "../model/history-model.js";
import { embedText, askGemini } from "../utils/gemini.js";
// import { cosineSimilarity } from "../utils/similarity.js";
// import { getEmbedding } from "../utils/gemini.js";
import { pinecone } from "../utils/pinecone-client.js";

// export const queryPDF = async (req, res) => {
//     try {
//         const { question, docId } = req.body;
//         const userId = req.userId;

//         // 1) Convert question → embedding
//         const qEmbedding = await embedText(question);

//         // 2) Load all chunks for this document
//         const chunks = await Chunk.find({ docId });

//         // 3) Compute cosine similarity
//         let scored = chunks.map(c => {
//             return {
//                 content: c.content,
//                 score: cosineSimilarity(qEmbedding, c.embedding)
//             };
//         });

//         // 4) Pick top 3 context chunks
//         scored.sort((a, b) => b.score - a.score);
//         const topContext = scored.slice(0, 3).map(c => c.content).join("\n");

//         // 5) Ask Gemini for answer
//         const answer = await askGemini(question, topContext);

//         // 6) Save history
//         await History.create({
//             userId,
//             docId,
//             question,
//             answer
//         });

//         return res.json({
//             answer,
//             usedContext: topContext
//         });

//     } catch (err) {
//         res.status(500).json({ msg: "Server error", error: err.message });
//     }
// };




export const queryPDF = async (req, res) => {
  try {
    const { question, docId } = req.body;
    const userId = req.userId;

    if (!question || !docId) {
      return res.status(400).json({ msg: "Missing question or docId" });
    }

    const index = pinecone.Index("pdf-rag");

    // 1) Question → Embedding
    const queryEmbedding = await embedText(question, "query");

    // 2) Search Pinecone vectors
    // Increased topK to 20 to retrieve more context for broad questions
    const result = await index.query({
      vector: queryEmbedding,
      topK: 20, 
      includeMetadata: true,
      filter: { docId: docId.toString() }
    });

    if (!result.matches.length) {
      return res.status(404).json({ msg: "No relevant chunks found" });
    }

    // 3) Combine top chunks
    const context = result.matches.map(m => m.metadata.content).join("\n\n");

    // 3.5) Fetch previous conversation history (last 3 turns)
    const previousHistory = await History.find({ userId, docId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Reverse to chronological order and format
    const historyText = previousHistory
      .reverse()
      .map(h => `User: ${h.question}\nAI: ${h.answer}`)
      .join("\n\n");

    // 4) Ask Gemini using context AND history
    const answer = await askGemini(question, context, historyText);

    // 5) Save to history
    await History.create({
      userId,
      docId,
      question,
      answer,
      createdAt: new Date()
    });

    // console.log("Generated answer:", answer);

    // 6) Return answer
    res.json({
      answer,
      contextUsed: context,
      matches: result.matches
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};