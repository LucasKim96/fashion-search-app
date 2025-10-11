import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { CartModel } from "../modules/cart/index.js"; // hoặc đúng alias module của bạn

dotenv.config({ path: path.resolve("./server/.env") });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/fashiondb";

// ⚙️ Dữ liệu seed mẫu
const cartsSeed = [
  {
    accountId: "68e8bfe2cb715d27f9409f6b", // Account 1
    cartItems: [
      {
        productVariantId: "6706a2e1c9aefb1b3412d001",
        quantity: 2,
      },
      {
        productVariantId: "6706a2e1c9aefb1b3412d002",
        quantity: 1,
      },
    ],
  },
  {
    accountId: "68e8bfe2cb715d27f9409f6c", // Account 2
    cartItems: [
      {
        productVariantId: "6706a2e1c9aefb1b3412d003",
        quantity: 3,
      },
    ],
  },
];

const seedCarts = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "fashiondb",
    });
    console.log("✅ MongoDB connected");

    await CartModel.deleteMany(); // Xóa giỏ hàng cũ
    const inserted = await CartModel.insertMany(cartsSeed);
    console.log("✅ Seeded carts:", inserted);

    await mongoose.disconnect();
    console.log("🧹 Disconnected MongoDB");
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

seedCarts();
