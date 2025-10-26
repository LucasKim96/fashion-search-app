import mongoose from "mongoose";

const attributeValueSchema = new mongoose.Schema({
  attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute", required: true },
  value: { type: String, required: true, trim: true },     // Ví dụ: "Red", "M"
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null }, // nếu shop tạo riêng
  image: { type: String, default: "" },     // ảnh minh họa riêng cho giá trị này
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// 1. Cho giá trị global (shopId = null)
attributeValueSchema.index(
  { attributeId: 1, value: 1 },
  { unique: true, partialFilterExpression: { shopId: null } }
);

// 2. Cho giá trị shop-specific (shopId != null)
attributeValueSchema.index(
  { attributeId: 1, value: 1, shopId: 1 },
  { unique: true, partialFilterExpression: { shopId: { $exists: true, $type: "objectId" } } }
);

export default mongoose.model("AttributeValue", attributeValueSchema);
// Quy ước:
// Nếu priceAdjustment > 0 → tăng giá.
// Nếu priceAdjustment < 0 → giảm giá.