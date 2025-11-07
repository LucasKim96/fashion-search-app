import mongoose from "mongoose";
import dotenv from "dotenv";
import { Shop } from "../src/modules/shop/index.js";
import path from "path";

dotenv.config({ path: path.resolve("./server/.env") });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/fashiondb";

const shopsSeed = [
  {
    shopName: "Fashion Store A",
    description: "Shop A description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6b",
  },

  {
    shopName: "Fashion Store B",
    description: "Shop B description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6c",
  },

  {
    shopName: "Fashion Store C",
    description: "Shop C description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6d",
  },
  {
    shopName: "Fashion Store D",
    description: "Shop D description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6e",
  },
  {
    shopName: "Fashion Store E",
    description: "Shop E description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6f",
  },

  {
    shopName: "Fashion Store F",
    description: "Shop F description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f70",
  },
  {
    shopName: "Fashion Store G",
    description: "Shop G description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f71",
  },
  {
    shopName: "Fashion Store H",
    description: "Shop H description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f72",
  },
  {
    shopName: "Fashion Store I",
    description: "Shop I description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f73",
  },
  {
    shopName: "Fashion Store J",
    description: "Shop J description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f74",
  },
  {
    shopName: "Fashion Store K",
    description: "Shop K description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f75",
  },
  {
    shopName: "Fashion Store L",
    description: "Shop L description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f76",
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

    await Shop.deleteMany(); // xóa hết shop cũ
    const inserted = await Shop.insertMany(shopsSeed);
    console.log("✅ Seeded shops:", inserted);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

seedShops();
