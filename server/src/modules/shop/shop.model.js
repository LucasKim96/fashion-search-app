// Shop Model
import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    coverUrl: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      // required: true,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "closed", "suspended"],
      default: "active",
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true,
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Shop", shopSchema);
