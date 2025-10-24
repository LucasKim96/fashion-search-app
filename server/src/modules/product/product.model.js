// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema({
//   pdName: { type: String, required: true, trim: true },
//   images: { type: [String], default: [] },
//   description: { type: String, default: "" },
//   shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
// }, { timestamps: true });

// export default mongoose.model("Product", productSchema);

import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  pdName: { type: String, required: true, trim: true },
  basePrice: { type: Number, required: true, min: 0 }, // giá gốc của sản phẩm
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  isActive: { type: Boolean, default: true }, //ẩn khoá sản phẩm
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
