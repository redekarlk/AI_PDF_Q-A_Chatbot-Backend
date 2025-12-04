import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Embed text using Gemini
export const embedText = async (text, type = "document") => {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    // Clean text: remove newlines and excessive spaces for better embeddings
    const cleanText = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    const taskType = type === "query"
        ? "RETRIEVAL_QUERY"
        : "RETRIEVAL_DOCUMENT";

    const result = await model.embedContent({
        content: { parts: [{ text: cleanText }] },
        taskType
    });

    return result.embedding.values;
};

// Generate answer using LLM
export const askGemini = async (question, context, history = "") => {
    // console.log("Asking Gemini with question:", question);
    // console.log("Context length:", context);
    // console.log("History length:", history);
    const model = genAI.getGenerativeModel({
        // model: "gemini-1.5-flash" // Using stable 1.5 flash model
         model: "gemini-2.5-flash"
    });

    const prompt = `
You are an intelligent AI assistant designed to answer questions based strictly on the provided document context.

INSTRUCTIONS:
1. Answer the user's question using ONLY the information from the CONTEXT below.
2. If the answer is not in the context, say "I cannot find the answer in the provided document."
3. Do not use outside knowledge.
4. Provide a detailed and comprehensive answer. Structure it with headings or bullet points if applicable.
5. If the context contains multiple relevant parts, synthesize them into a coherent answer.
6. Use the provided CHAT HISTORY to understand the context of follow-up questions (e.g., "what is it?" referring to the previous topic).

CHAT HISTORY:
${history}

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:
`;

    const reply = await model.generateContent(prompt);
    return reply.response.text();
};
