import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  shopName: String,
  logoUrl: String,
  coverUrl: String,
  description: String,
  status: {
    type: String,
    enum: ["active", "closed", "suspended"],
    default: "active",
  },

  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
});

export default mongoose.model("Shop", shopSchema);
