// Order Model
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderCode: String,
  status: {
    type: String,
    default: "pending",
    enum: [
      "pending",
      "packing",
      "shipping",
      "delivered",
      "completed",
      "cancelled",
    ],
  },
  totalAmount: Number,
  addressLine: { type: String, required: true },
  receiverName: { type: String, required: true },
  phone: { type: String, required: true },
  note: String,
  createdAt: { type: Date, default: Date.now },
  deliverAt: Date,

  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  orderItems: [
    {
      productVariantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
      },
      quantity: Number,
      priceAtOrder: Number,
    },
  ],
});

export default mongoose.model("Order", orderSchema);
