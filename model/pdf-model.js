import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    filePath: String,
     hash: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Document", documentSchema);
