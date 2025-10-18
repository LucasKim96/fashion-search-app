// server/scripts/createAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readlineSync from "readline-sync";
import dotenv from "dotenv";
import path from "path";
import connectDB from "../src/config/db.js"; 
import { Account, Role } from "../src/modules/account/index.js";
import { UserInfo } from "../src/modules/user/index.js";

// Load .env trong thư mục server
dotenv.config({ path: path.resolve("server/.env") });

// Kết nối MongoDB
await connectDB(process.env.MONGO_URI);

// Regex validate
const phoneRegex = /^(0|\+?84)[0-9]{9}$/;
const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// Main
(async () => {
  try {
    console.log("=== TAO TAI KHOAN ADMIN / SUPER ADMIN ===");

    // Nhập thông tin
    let username = "";
    while (true) {
      username = readlineSync.question("Nhap username: ");
      if (!usernameRegex.test(username))
        console.log("Username phai ≥4 ky tu, chi chua chu/so/_");
      else break;
    }

    let phoneNumber = "";
    while (true) {
      phoneNumber = readlineSync.question("Nhap so dien thoai: ");
      if (!phoneRegex.test(phoneNumber))
        console.log("So dien thoai khong hop le (vd: 0965000900)");
      else break;
    }

    // Kiểm tra username hoặc số diện thoại dã tồn tại
    const existing = await Account.findOne({
      $or: [{ username }, { phoneNumber }],
    });
    if (existing) {
      console.log("Username hoac so dien thoai da ton tai!");
      await mongoose.disconnect();
      process.exit(1);
    }

    let password = "";
    while (true) {
      password = readlineSync.question("Nhap mat khau: ", { hideEchoBack: true });
      if (!passwordRegex.test(password)) {
        console.log(
          "\nMat khau phai ≥8 ky tu, gom chu hoa, chu thuong và ky tu dac biet."
        );
      } else {
        const confirm = readlineSync.question("Xac nhan mat khau: ", { hideEchoBack: true });
        if (confirm !== password) console.log("\nMat khau xac nhan khong khop!");
        else break;
      }
    }

    let roleChoice = "";
    while (true) {
      roleChoice = readlineSync.question(
        "Tao tai khoan (1) Admin hay (2) Super Admin? [1/2]: "
      );
      if (roleChoice === "1" || roleChoice === "2") break;
      console.log("Vui long nhap 1 hoac 2!");
    }

    const roleName = roleChoice === "2" ? "Super Admin" : "Quản trị viên";
    const role = await Role.findOne({ roleName });
    if (!role) throw new Error(`Khong tim thay vai tro ${roleName} trong he thong!`);

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo UserInfo
    const userInfo = await UserInfo.create({
      name: "",
      gender: "other",
    });

    // Tạo tài khoản admin
    const newAccount = await Account.create({
      username,
      phoneNumber,
      password: hashedPassword,
      status: "inactive",
      isBanned: false,
      roles: [role._id],
      userInfoId: userInfo._id,
    });

    console.log(`\nTao tai khoan ${roleName} thanh cong!`);
    console.log(`Username: ${username}`);
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Role: ${roleName}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\nLoi:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
})();
