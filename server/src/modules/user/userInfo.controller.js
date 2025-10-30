import * as UserInfoService from "./userInfo.service.js";
import { handleValidation } from "../../utils/index.js";

// Lấy danh sách tất cả thông tin người dùng
export const getAllUsers = async (req, res) => {
  const result = await UserInfoService.getAll();
  res.status(result.success ? 200 : 400).json(result);
};

// Lấy thông tin người dùng theo ID
export const getUserById = async (req, res) => {
  const result = await UserInfoService.getById(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
};

// Lấy thông tin người dùng theo email
export const getUserByEmail = async (req, res) => {
  const result = await UserInfoService.getByEmail(req.params.email);
  res.status(result.success ? 200 : 400).json(result);
};

export const updateBasicUserInfo = async (req, res) => {
  const validationError = handleValidation(req);
  if (validationError) return res.status(400).json(validationError);

  const result = await UserInfoService.updateBasicUserInfo(req.params.id, req.body);
  res.status(result.success ? 200 : 400).json(result);
};

// Cập nhật ảnh đại diện
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    const file = req.file;

    const result = await UserInfoService.updateAvatar(userId, file);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật ảnh đại diện mặc định cho toàn bộ user chưa có ảnh riêng
export const updateDefaultAvatar = async (req, res) => {
  try {
    const file = req.file;

    const result = await UserInfoService.updateDefaultAvatar(file);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tìm kiếm người dùng theo tên, email
export const searchUsers = async (req, res) => {
  const { keyword } = req.query;
  const result = await UserInfoService.search(keyword);
  res.status(result.success ? 200 : 400).json(result);
};

// Thống kê số lượng người dùng theo giới tính
export const statsByGender = async (req, res) => {
  const result = await UserInfoService.statsByGender();
  res.status(result.success ? 200 : 400).json(result);
};

// Thống kê theo độ tuổi
export const statsByAgeRange = async (req, res) => {
  const result = await UserInfoService.statsByAgeRange();
  res.status(result.success ? 200 : 400).json(result);
};
