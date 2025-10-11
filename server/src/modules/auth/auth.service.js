// Auth Service
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Account, Role } from "../account/index.js";
import { UserInfo } from "../user/index.js";
import dotenv from "dotenv";
import moment from "moment-timezone";

dotenv.config();

// Cấu hình JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1d";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

// Đăng ký tài khoản mới
export const register = async (data) => {
  try {
    const { username, phoneNumber, password } = data;

    // Kiểm tra username hoặc số điện thoại đã tồn tại
    const existing = await Account.findOne({
      $or: [{ username }, { phoneNumber }],
    });
    if (existing) throw new Error("Username hoặc số điện thoại đã tồn tại!" );

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lấy vai trò (đã seed sẵn)
    const role = await Role.findOne({ roleName: "Khách hàng" });
    if (!role) throw new Error("Không tìm thấy vai trò mặc định trong hệ thống!");

    // Tạo userInfo rỗng
    const userInfoDoc = await UserInfo.create({
      name: "",
      dayOfBirth: null,
      gender: "other",
    });

    // Tạo tài khoản
    const account = await Account.create({
      username,
      phoneNumber,
      password: hashedPassword,
      roles: [role._id],
      userInfoId: userInfoDoc._id,
    });

    return {
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: account,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || error.message || "Đăng ký thất bại!",
    };
  }
};

// Đăng nhập
export const login = async ({ usernameOrPhone, password }) => {
  try {
    // Tìm tài khoản bằng username hoặc số điện thoại
    const account = await Account.findOne({
      $or: [{ username: usernameOrPhone }, { phoneNumber: usernameOrPhone }],
    }).populate("roles");

    if (!account) throw new Error("Tài khoản không tồn tại!");
    if (account.status === "banned")
      throw new Error("Tài khoản của bạn đã bị khóa!");


    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) throw new Error("Sai mật khẩu!");

    // Tạo accessToken và refreshToken
    const roles = account.roles.map((r) => r.roleName);
    const payload = { id: account._id, roles };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // Cập nhật lần đăng nhập cuối
    account.lastLogin = new Date();
    await account.save();

    return {
      success: true, message: "Đăng nhập thành công!", 
      data: { 
        account:{ // chuyển đổi sang giờ việt nam
          ...account.toObject(),
          lastLoginVN: moment(account.lastLogin)
            .tz("Asia/Ho_Chi_Minh")
            .format("YYYY-MM-DD HH:mm:ss"),
        },
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Đăng nhập thất bại!",
    };
  }
};

// Làm mới token
export const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, roles: decoded.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return {
      success: true,
      message: "Làm mới token thành công!",
      data: { accessToken: newAccessToken },
    };
  } catch {
    return {
      success: false,
      message: "Refresh token không hợp lệ hoặc đã hết hạn!",
    };
  }
};

//  Xác minh token
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      message: "Token hợp lệ!",
      data: decoded, // chứa userId, role, exp,...
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { success: false, message: "Token đã hết hạn!" };
    }
    if (error.name === "JsonWebTokenError") {
      return { success: false, message: "Token không hợp lệ!" };
    }
    return { success: false, message: "Lỗi xác thực token!" };
  }
};

// Đổi mật khẩu
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const account = await Account.findById(userId);
    if (!account)  throw new Error("Không tìm thấy tài khoản!");

    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) throw new Error("Mật khẩu cũ không đúng!");

    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();

    return { success: true, message: "Đổi mật khẩu thành công!" };
  } catch (error) {
    return { success: false, message: error.message || "Đổi mật khẩu thất bại!" };
  }
};

// Lấy thông tin tài khoản
export const getProfile = async (userId) => {
  try {
    const account = await Account.findById(userId)
      .populate("roles")
      .populate("userInfoId");
    if (!account) throw new Error("Không tìm thấy tài khoản!");
    return { success: true, data: account };
  } catch (error) {
    return { success: false, message: error.message || "Không lấy được thông tin tài khoản!" };
  }
};
