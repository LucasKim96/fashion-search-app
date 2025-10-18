// services/userInfo.service.js
import UserInfo from "./userInfo.model.js";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("src/uploads/avatars");
const assetsDir = path.resolve("src/assets");

// Đảm bảo thư mục uploads tồn tại
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Lấy danh sách tất cả người dùng (Admin)
export const getAll = async () => {
  try {
    const users = await UserInfo.find().sort({ createdAt: -1 });
    return { success: true, message: "Lấy danh sách người dùng thành công!", data: users };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

// Lấy thông tin người dùng theo ID
export const getById = async (id) => {
  try {
    const user = await UserInfo.findById(id);
    if (!user) throw new Error("Không tìm thấy người dùng!");
    return { success: true, message: "Lấy thông tin người dùng thành công!", data: user };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

// Lấy thông tin người dùng theo email
export const getByEmail = async (email) => {
  try {
    const user = await UserInfo.findOne({ email });
    if (!user) throw new Error("Không tìm thấy người dùng!");
    return { success: true, message: "Lấy thông tin người dùng thành công!", data: user };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

// Cập nhật ảnh đại diện
export const updateAvatar = async (id, file, imageUrl) => {
  try {
    const user = await UserInfo.findById(id);
    if (!user) throw new Error("Không tìm thấy người dùng!");

    let newAvatar = user.avatar;
    if (file) {
      const filename = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      newAvatar = `/uploads/avatars/${filename}`;

      // Xóa ảnh cũ nếu không phải mặc định
      if (user.avatar && !user.avatar.includes("default-avatar.jpg")) {
        const oldPath = path.join(uploadDir, path.basename(user.avatar));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } else if (imageUrl) {
      newAvatar = imageUrl;
    }

    user.avatar = newAvatar;
    await user.save();

    return { success: true, message: "Cập nhật ảnh đại diện thành công!", data: user };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

// Cập nhật các thông tin cơ bản (name, dayOfBirth, gender, email)
export const updateBasicUserInfo = async (id, updateData) => {
  try {
    const user = await UserInfo.findById(id);
    if (!user) throw new Error("Không tìm thấy người dùng!");

    let hasChange = false;
    const allowedFields = ["name", "dayOfBirth", "gender", "email"];

    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(updateData, key) &&
        updateData[key] !== undefined &&
        updateData[key] !== user[key]
      ) {
        // Kiểm tra email unique
        if (key === "email") {
          const existEmail = await UserInfo.findOne({ email: updateData.email, _id: { $ne: id } });
          if (existEmail) throw new Error("Email đã tồn tại!");
        }
        user[key] = updateData[key];
        hasChange = true;
      }
    }

    if (hasChange) {
      await user.save();
      return { success: true, message: "Cập nhật thông tin thành công!", data: user };
    }

    return { success: true, message: "Không có thay đổi nào được thực hiện!", data: user };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

export const updateDefaultAvatar = async (file, imageUrl) => {
  try {
    const defaultAvatarPath = path.join(assetsDir, "default-avatar.jpg");

    // Xóa ảnh cũ nếu tồn tại
    if (fs.existsSync(defaultAvatarPath)) {
      fs.unlinkSync(defaultAvatarPath);
    }

    // Lưu ảnh mới
    if (file) {
      fs.writeFileSync(defaultAvatarPath, file.buffer);
    } else if (imageUrl) {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Không tải được ảnh từ URL!");
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(defaultAvatarPath, buffer);
    } else {
      throw new Error("Chưa có ảnh mới để cập nhật!");
    }

    return { 
      success: true, 
      message: "Cập nhật ảnh đại diện mặc định thành công cho tất cả người dùng!" 
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};


// Tìm kiếm người dùng theo tên hoặc email
export const search = async (query) => {
  try {
    if (!query || query.trim() === "") throw new Error("Vui lòng nhập từ khóa tìm kiếm!");
    const regex = new RegExp(query, "i");
    const users = await UserInfo.find({
      $or: [{ name: regex }, { email: regex }],
    });
    return { success: true, message: `Tìm thấy ${users.length} người dùng`, data: users };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

// Thống kê số lượng người dùng theo giới tính
export const statsByGender = async () => {
  try {
    const stats = await UserInfo.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);
    return { success: true, message: "Thống kê theo giới tính thành công!", data: stats };
  } catch (error) {
    // Sửa đổi: Bắt lỗi và trả về object { success: false, message: ... }
    return { success: false, message: error.message };
  }
};

// Thống kê người dùng theo độ tuổi
export const statsByAgeRange = async () => {
  try {
    const users = await UserInfo.find({ dayOfBirth: { $ne: null } });
    const now = new Date();
    const stats = { "18-25": 0, "26-35": 0, "36-50": 0, "50+": 0 };

    users.forEach((u) => {
      const age = Math.floor((now - new Date(u.dayOfBirth)) / (365 * 24 * 60 * 60 * 1000));
      if (age >= 18 && age <= 25) stats["18-25"]++;
      else if (age >= 26 && age <= 35) stats["26-35"]++;
      else if (age >= 36 && age <= 50) stats["36-50"]++;
      else if (age > 50) stats["50+"]++;
    });

    return { success: true, message: "Thống kê theo độ tuổi thành công!", data: stats };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Thêm hàm xóa người dùng (Ví dụ)
// export const deleteUser = async (id) => {
//   try {
//     const user = await UserInfo.findById(id);
//     if (!user) throw new Error("Không tìm thấy người dùng để xóa!");

//     // Xóa file avatar nếu không phải file mặc định
//     if (user.avatar && !user.avatar.includes("default-avatar.jpg")) {
//       const oldPath = path.join(uploadDir, path.basename(user.avatar));
//       if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//     }

//     await UserInfo.findByIdAndDelete(id);

//     return { success: true, message: "Xóa người dùng thành công!", data: null };
//   } catch (error) {
//     // Áp dụng mẫu trả lỗi: return { success: false, message: error.message };
//     return { success: false, message: error.message };
//   }
// };
