import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    _id: String, // documentId (UUID)
    data: { type: Object, default: null }, // Quill delta (ops)
    title: { type: String, default: "Untitled" }
  },
  { timestamps: true }
);

export default mongoose.model("Document", DocumentSchema);