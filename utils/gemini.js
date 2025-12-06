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

//     const prompt = `
// You are an intelligent AI assistant designed to answer questions based strictly on the provided document context.

// INSTRUCTIONS:
// 1. Answer the user's question using ONLY the information from the CONTEXT below.
// 2. If the answer is not in the context, say "I cannot find the answer in the provided document."
// 3. Do not use outside knowledge.
// 4. Provide a detailed and comprehensive answer. Structure it with headings or bullet points if applicable.
// 5. If the context contains multiple relevant parts, synthesize them into a coherent answer.
// 6. Use the provided CHAT HISTORY to understand the context of follow-up questions (e.g., "what is it?" referring to the previous topic).

// CHAT HISTORY:
// ${history}

// CONTEXT:
// ${context}

// QUESTION:
// ${question}

// ANSWER:
// `;


const prompt = `
You are an intelligent AI assistant producing documentation-style answers from the provided CONTEXT.

INSTRUCTIONS:
1. Use ONLY the CONTEXT. If absent, return exactly: "I cannot find the answer in the provided document."
2. Output MARKDOWN only. No raw HTML or extraneous metadata.
3. Use a clear structure:
   - Title: a single H1 (#) with the short answer or topic (one line).
   - Summary: a brief 1–2 sentence paragraph.
   - Details: use H2 (##) sections and bullet lists or numbered steps.
   - Examples / Code: fenced code blocks with language tags where relevant.
   - Table: use Markdown table format when presenting structured comparisons or data.
4. Enforce formatting rules:
   - One blank line before and after headings, lists, code blocks, and tables.
   - Paragraphs max 2 sentences.
   - Code must be inside fenced code blocks, written as: \\\`\\\`\\\`js (or python, etc.)
   - Do NOT produce inline HTML under any circumstances.
5. If multiple context parts are relevant, synthesize and cite the parts used in a final short "Sources" bullet list (e.g., "Sources: section 2.1, Appendix A").
6. If the question requires step-by-step instructions, number the steps and include estimated complexity/time only if present in CONTEXT.
7. Preserve fidelity: do not invent facts or attributes not present in CONTEXT.
8. Keep the tone neutral, concise, and documentation-like.
9. If the context contains multiple relevant parts, synthesize them into a coherent answer.
10. Use the provided CHAT HISTORY to understand the context of follow-up questions (e.g., "what is it?" referring to the previous topic).


CHAT HISTORY:
${history}

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:
`;

console.log(prompt);


    const reply = await model.generateContent(prompt);
    return reply.response.text();
};
