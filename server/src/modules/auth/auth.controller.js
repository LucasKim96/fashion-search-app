import { handleValidation } from "../../utils/index.js";
import * as AuthService from "./auth.service.js";

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

// [POST] /api/auth/logout
export const logout = async (req, res) => {
  try {
    const userId = req.user?.id; // lấy từ middleware xác thực (decode từ token)

    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Thiếu token hoặc token không hợp lệ!" });

    const result = await AuthService.logout(userId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Lỗi máy chủ!" });
  }
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