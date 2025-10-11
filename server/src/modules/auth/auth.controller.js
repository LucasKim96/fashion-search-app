import { validationResult } from "express-validator";
import * as AuthService from "./auth.service.js";
import jwt from "jsonwebtoken";

// Xử lý kết quả validate
const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return {
      success: false,
      message: errors.array()[0].msg, // chỉ lấy lỗi đầu tiên
    };
  }
  return null;
};

// [POST] /api/auth/register
export const register = async (req, res) => {
  const validationError = handleValidation(req);
  if (validationError) return res.status(400).json(validationError);

  const result = await AuthService.register(req.body);
  res.status(result.success ? 200 : 400).json(result);
};

// [POST] /api/auth/login
export const login = async (req, res) => {
  const validationError = handleValidation(req);
  if (validationError) return res.status(400).json(validationError);

  const result = await AuthService.login(req.body);
  res.status(result.success ? 200 : 400).json(result);
};

// [POST] /api/auth/refresh
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ success: false, message: "Thiếu refresh token!" });

  const result = await AuthService.refresh(refreshToken);
  res.status(result.success ? 200 : 400).json(result);
};

// [POST] /api/auth/verify
export const verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ success: false, message: "Thiếu hoặc sai định dạng token!" });
  }

  const token = authHeader.split(" ")[1]; // lấy token

  const result = await AuthService.verifyToken(token);
  res.status(result.success ? 200 : 400).json(result);
};


// [POST] /api/auth/change-password
export const changePassword = async (req, res) => {
  const validationError = handleValidation(req);
  if (validationError) return res.status(400).json(validationError);

  const userId = req.user?.id; // lấy từ middleware
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ success: false, message: "Thiếu thông tin cần thiết!" });

  const result = await AuthService.changePassword(userId, oldPassword, newPassword);
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/auth/me
export const getProfile = async (req, res) => {
  const userId = req.user?.id; // lấy từ authMiddleware
  if (!userId) return res.status(401).json({ success: false, message: "Thiếu token!" });

  const result = await AuthService.getProfile(userId);
  res.status(result.success ? 200 : 404).json(result);
};