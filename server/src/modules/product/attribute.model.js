import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },   // ví dụ: "Size", "Color"
  value: { type: String, required: true, trim: true }, // ví dụ: "M", "Red"
}, { timestamps: true });

export default mongoose.model("Attribute", attributeSchema);
