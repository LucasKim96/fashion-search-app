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
    accountId: "68e8bfe2cb715d27f9409f6b",
  },

  {
    shopName: "Fashion Store B",
    logoUrl: "https://example.com/logoB.png",
    coverUrl: "https://example.com/coverB.png",
    description: "Shop B description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6c",
  },

  {
    shopName: "Fashion Store C",
    logoUrl: "https://example.com/logoC.png",
    coverUrl: "https://example.com/coverC.png",
    description: "Shop C description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6d",
  },
  {
    shopName: "Fashion Store D",
    logoUrl: "https://example.com/logoD.png",
    coverUrl: "https://example.com/coverD.png",
    description: "Shop D description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6e",
  },
  {
    shopName: "Fashion Store E",
    logoUrl: "https://example.com/logoE.png",
    coverUrl: "https://example.com/coverE.png",
    description: "Shop E description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f6f",
  },

  {
    shopName: "Fashion Store F",
    logoUrl: "https://example.com/logoF.png",
    coverUrl: "https://example.com/coverF.png",
    description: "Shop F description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f70",
  },
  {
    shopName: "Fashion Store G",
    logoUrl: "https://example.com/logoG.png",
    coverUrl: "https://example.com/coverG.png",
    description: "Shop G description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f71",
  },
  {
    shopName: "Fashion Store H",
    logoUrl: "https://example.com/logoH.png",
    coverUrl: "https://example.com/coverH.png",
    description: "Shop H description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f72",
  },
  {
    shopName: "Fashion Store I",
    logoUrl: "https://example.com/logoI.png",
    coverUrl: "https://example.com/coverI.png",
    description: "Shop I description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f73",
  },
  {
    shopName: "Fashion Store J",
    logoUrl: "https://example.com/logoJ.png",
    coverUrl: "https://example.com/coverJ.png",
    description: "Shop J description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f74",
  },
  {
    shopName: "Fashion Store K",
    logoUrl: "https://example.com/logoK.png",
    coverUrl: "https://example.com/coverK.png",
    description: "Shop K description",
    status: "closed",
    accountId: "68e8bfe2cb715d27f9409f75",
  },
  {
    shopName: "Fashion Store L",
    logoUrl: "https://example.com/logoL.png",
    coverUrl: "https://example.com/coverL.png",
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

    await ShopModel.deleteMany(); // xóa hết shop cũ
    const inserted = await ShopModel.insertMany(shopsSeed);
    console.log("✅ Seeded shops:", inserted);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

seedShops();
