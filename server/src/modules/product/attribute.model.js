// import mongoose from "mongoose";

// const attributeSchema = new mongoose.Schema({
//   key: { type: String, required: true, trim: true },   // ví dụ: "Size", "Color"
//   value: { type: String, required: true, trim: true }, // ví dụ: "M", "Red"
// }, { timestamps: true });

// export default mongoose.model("Attribute", attributeSchema);
//

import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true }, // Ví dụ: "Color", "Size"
  isGlobal: { type: Boolean, default: false },        // true nếu dùng chung toàn hệ thống
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" }, // null nếu là global
}, { timestamps: true });

attributeSchema.index({ shopId: 1, label: 1 }, { unique: true });

export default mongoose.model("Attribute", attributeSchema);
