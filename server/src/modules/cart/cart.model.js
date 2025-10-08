// Cart Model
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  cartItems: [
    {
      productVariantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
      },
      quantity: Number,
    },
  ],
});

export default mongoose.model("Cart", cartSchema);
