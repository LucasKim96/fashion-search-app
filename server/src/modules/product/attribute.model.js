import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true }, // Ví dụ: "Color", "Size"
  isGlobal: { type: Boolean, default: false },        // true nếu dùng chung toàn hệ thống
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" }, // null nếu là global
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

//Index 1: dành cho global attributes (shopId = null)
attributeSchema.index(
  { label: 1 },
  { unique: true, partialFilterExpression: { shopId: null } }
);

//Index 2: dành cho shop-specific attributes (shopId != null)
attributeSchema.index(
  { label: 1, shopId: 1 },
  { unique: true, partialFilterExpression: { shopId: { $ne: null } } }
);



export default mongoose.model("Attribute", attributeSchema);
