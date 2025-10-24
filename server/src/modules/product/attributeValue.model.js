// import mongoose from "mongoose";

// const attributeDetailSchema = new mongoose.Schema({
//   productVariantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
//   attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute", required: true },
// }, { timestamps: true });

// export default mongoose.model("AttributeDetail", attributeDetailSchema);

import mongoose from "mongoose";

const attributeValueSchema = new mongoose.Schema({
  attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute", required: true },
  value: { type: String, required: true, trim: true },     // Ví dụ: "Red", "M"
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null }, // nếu shop tạo riêng
  image: { type: String, default: "" },     // ảnh minh họa riêng cho giá trị này
  priceAdjustment: { type: Number, default: 0 },           // ví dụ +10 hoặc -15 so với basePrice
}, { timestamps: true });

attributeValueSchema.index({ attributeId: 1, value: 1, shopId: 1 }, { unique: true });

export default mongoose.model("AttributeValue", attributeValueSchema);
// Quy ước:
// Nếu priceAdjustment > 0 → tăng giá.
// Nếu priceAdjustment < 0 → giảm giá.