import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    question: String,
    answer: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("History", historySchema);
