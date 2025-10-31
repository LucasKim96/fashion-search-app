import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productVariantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },

  // Snapshot dữ liệu lúc thêm (phòng khi Product/Variant bị xóa hoặc đổi)
  priceAtAdd: { type: Number, required: true },
  imageAtAdd: { type: String },
  pdNameAtAdd: { type: String },

  // Các thuộc tính của variant (vd: Color: Red, Size: M)
  attributes: [
    {
      attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute" },
      valueId: { type: mongoose.Schema.Types.ObjectId, ref: "AttributeValue" },
    },
  ],
});

const cartSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    cartItems: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.index({ accountId: 1 }); // dễ truy vấn theo người dùng

export default mongoose.model("Cart", cartSchema);
