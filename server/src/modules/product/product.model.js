import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    pdName: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    description: { type: String, default: "" },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
