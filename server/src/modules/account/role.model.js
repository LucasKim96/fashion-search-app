import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  roleName: { type: String, required: true, trim: true },
  level: { type: Number, default: 1 },
}, { timestamps: true });

export default mongoose.model("Role", roleSchema);