import mongoose from "mongoose";

const attributeDetailSchema = new mongoose.Schema({
  productVariantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
  attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute", required: true },
}, { timestamps: true });

export default mongoose.model("AttributeDetail", attributeDetailSchema);
