import express from "express";
import * as UserInfoController from "./userInfo.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { isAdminOrSuperAdmin, isSelf, isSelfOrAdmin } from "../../middlewares/role.middleware.js";
import { validateUpdateBasicUserInfo } from "./userInfo.validate.js";
import multer from "multer";

const router = express.Router();
const upload = multer(); // dùng memory storage, nếu cần lưu file ở server

// --- Admin routes ---
// Lấy danh sách tất cả người dùng
router.get("/", authMiddleware, isAdminOrSuperAdmin, UserInfoController.getAllUsers);
// Lấy người dùng theo email
router.get("/email/:email", authMiddleware, isAdminOrSuperAdmin, UserInfoController.getUserByEmail);
// Tìm kiếm người dùng theo tên/email
router.get("/search", authMiddleware, isAdminOrSuperAdmin, UserInfoController.searchUsers);
// Thống kê người dùng theo giới tính
router.get("/stats/gender", authMiddleware, isAdminOrSuperAdmin, UserInfoController.statsByGender);
// Thống kê người dùng theo độ tuổi
router.get("/stats/age", authMiddleware, isAdminOrSuperAdmin, UserInfoController.statsByAgeRange);
// Thay đổi avatar mặc định cho tất cả người dùng chưa có avatar riêng (Admin)
router.put("/default-avatar", authMiddleware, isAdminOrSuperAdmin, upload.single("avatar"), UserInfoController.updateDefaultAvatar);
// Lấy người dùng theo ID
router.get("/:id", authMiddleware, isSelfOrAdmin, UserInfoController.getUserById);

// --- User routes ---
// Cập nhật ảnh đại diện (self hoặc admin)
router.put("/avatar/:id", authMiddleware, isSelf, upload.single("avatar"), UserInfoController.updateAvatar);
// Cập nhật thông tin cơ bản (name, dayOfBirth, gender, email)
router.put("/basic-info/:id", authMiddleware, isSelf, validateUpdateBasicUserInfo, UserInfoController.updateBasicUserInfo);

export default router;
