//cd ./server
//node ./server/src/seed/seedRoles.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../modules/account/role.model.js";
import path from "path";

dotenv.config({ path: path.resolve("./server/.env") });
// Danh sách vai trò mặc định cho nền tảng bán hàng có shop
const roles = [
  {
    roleName: "Khách hàng", // người mua hàng thông thường
    level: 1,
  },
  {
    roleName: "Chủ shop", // tài khoản có thể mở 1 shop riêng
    level: 2,
  },
  {
    roleName: "Quản trị viên", // quản lý toàn bộ hệ thống (admin)
    level: 3,
  },
  {
    roleName: "Super Admin", // quyền cao nhất, quản lý admin và hệ thống
    level: 4,
  },
];

async function seedRoles() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Đã kết nối MongoDB");

    // Xóa dữ liệu cũ (nếu muốn làm mới bảng Role)
    await Role.deleteMany({});
    console.log("Đã xóa các vai trò cũ");

    // Thêm danh sách vai trò mặc định
    await Role.insertMany(roles);
    console.log("Đã thêm danh sách vai trò mặc định thành công");

    // Đóng kết nối
    await mongoose.connection.close();
    console.log("🔒 Đã đóng kết nối MongoDB");
  } catch (error) {
    console.error("❌ Lỗi khi seed vai trò:", error);
    process.exit(1);
  }
}

seedRoles();
