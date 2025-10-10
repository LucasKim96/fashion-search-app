import mongoose from "mongoose";
import dotenv from "dotenv";
import { ShopModel } from "../modules/shop/index.js";
import path from "path";

dotenv.config({ path: path.resolve("./server/.env") });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/fashiondb";

const shopsSeed = [
  {
    shopName: "Fashion Store A",
    logoUrl: "https://example.com/logoA.png",
    coverUrl: "https://example.com/coverA.png",
    description: "Shop A description",
    status: "closed",
    accountId: "670811900000000000000000",
  },

  {
    shopName: "Fashion Store B",
    logoUrl: "https://example.com/logoB.png",
    coverUrl: "https://example.com/coverB.png",
    description: "Shop B description",
    status: "closed",
    accountId: "670811900000000000000000",
  },
];

const seedShops = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "fashiondb",
    });
    console.log("✅ MongoDB connected");

    await ShopModel.deleteMany(); // xóa hết shop cũ
    const inserted = await ShopModel.insertMany(shopsSeed);
    console.log("✅ Seeded shops:", inserted);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

seedShops();
