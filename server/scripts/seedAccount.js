import mongoose from "mongoose";
import dotenv from "dotenv";
import Account from "../src/modules/account/account.model.js"; // đường dẫn tuỳ theo cấu trúc của bạn
import bcrypt from "bcryptjs";
import path from "path";

dotenv.config({ path: path.resolve("./server/.env") });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/fashionDB";

const seedAccounts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Xoá account cũ để tránh trùng phone/username
    // await Account.deleteMany({});

    // Băm password mẫu
    const passwordHash = await bcrypt.hash("123456", 10);
    const zeropwd = await bcrypt.hash("1316109070", 10);

    const accounts = [
      {
        username: "sellerE",
        phoneNumber: "0901000005",
        password: passwordHash,
        status: "active",
        roles: [], // thêm sau nếu có role model
      },
      {
        username: "sellerF",
        phoneNumber: "0901000006",
        password: passwordHash,
        status: "active",
        roles: [],
      },
      // {
      //   username: "ZeroAdmin",
      //   phoneNumber: "0916613912",
      //   password: zeropwd,
      //   status: "active",
      //   roles: ["68e76a6a3c683a928eb104f1"],
      // },
    ];

    const createdAccounts = await Account.insertMany(accounts);

    console.log("✅ Seeded Accounts:");
    console.log(
      createdAccounts.map((a) => ({
        id: a._id,
        username: a.username,
        phoneNumber: a.phoneNumber,
      }))
    );

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding accounts:", err);
    process.exit(1);
  }
};

seedAccounts();
