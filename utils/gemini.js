import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Embed text using Gemini
export const embedText = async (text) => {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
};

// Generate answer using LLM
export const askGemini = async (question, context) => {
    const model = genAI.getGenerativeModel({
        // model: "gemini-1.5-flash-latest"
        model: "gemini-2.5-flash"
    });

    const prompt = `
Use ONLY the following context to answer the question.

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:
`;

    const reply = await model.generateContent(prompt);
    return reply.response.text();
};
