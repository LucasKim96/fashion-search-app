import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  stock: { type: Number, default: 0, min: 0 },
  image: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
}, { timestamps: true });

export default mongoose.model("ProductVariant", productVariantSchema);
