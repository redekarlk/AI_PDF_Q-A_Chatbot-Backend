import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    content: String,
    embedding: [Number] 
});

export default mongoose.model("Chunk", chunkSchema);
