// import mongoose from "mongoose";

// const productVariantSchema = new mongoose.Schema({
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
//   stock: { type: Number, default: 0, min: 0 },
//   image: { type: String, default: "" },
//   price: { type: Number, required: true, min: 0 },
// }, { timestamps: true });

// export default mongoose.model("ProductVariant", productVariantSchema);

import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantKey: { type: String, required: true }, // ví dụ "valid1|valid2" (sorted)
  attributes: [{      // Là danh sách cặp (attributeId, valueId), ví dụ: [Color: Red, Size: M]
    attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute", required: true },
    valueId: { type: mongoose.Schema.Types.ObjectId, ref: "AttributeValue", required: true },
  }],
  stock: { type: Number, default: 0, min: 0 },
  images: { type: [String], default: [] }, // ảnh riêng cho biến thể (vd áo trắng size M)
  //không lưu giá mà dùng basePrice + priceAdjustment để tính giá
}, { timestamps: true });

productVariantSchema.index({ productId: 1, variantKey: 1 }, { unique: true });
export default mongoose.model("ProductVariant", productVariantSchema);
