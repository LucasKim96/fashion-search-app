import express from "express";
import * as AccountController from "./account.controller.js";
import { validateUpdateBasicInfo } from "./account.validate.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { isAdminOrSuperAdmin, isSuperAdmin, isSelf, isSelfOrAdmin } from "../../middlewares/role.middleware.js";

const router = express.Router();


router.get("/roles", authMiddleware, isAdminOrSuperAdmin, AccountController.getAllRoles);
// Lấy danh sách tài khoản
router.get("/", authMiddleware, isAdminOrSuperAdmin, AccountController.getAllAccounts);
// Lấy danh sách theo trạng thái (active / inactive)
router.get("/status/:status", authMiddleware, isAdminOrSuperAdmin, AccountController.getAccountsByStatus);
// Lấy danh sách theo vai trò
router.get("/role/:roleId", authMiddleware, isAdminOrSuperAdmin, AccountController.getAccountsByRole);
// Lấy danh sách tài khoản bị chặn
router.get("/banned", authMiddleware, isAdminOrSuperAdmin, AccountController.getBannedAccounts);
// Lấy danh sách tài khoản không bị chặn
router.get("/unbanned", authMiddleware, isAdminOrSuperAdmin, AccountController.getUnbannedAccounts);
// Chặn hoặc mở chặn tài khoản
router.patch("/ban-toggle/:id", authMiddleware, isSuperAdmin, AccountController.toggleBanAccount);
// Cập nhật vai trò tài khoản (ghi đè toàn bộ mảng)
router.put("/update-roles/:id", authMiddleware, isSuperAdmin, AccountController.updateRoles);
// Cập nhật (thêm / xóa) vai trò tài khoản linh hoạt
router.put("/modify-roles/:id", authMiddleware, isSuperAdmin, AccountController.modifyRoles);
// Thống kê số lượng tài khoản theo trạng thái
router.get("/stats/status", authMiddleware, isAdminOrSuperAdmin, AccountController.countByStatus);
// Thống kê số lượng tài khoản bị khóa / không bị khóa
router.get("/stats/banned", authMiddleware, isAdminOrSuperAdmin, AccountController.countBannedAccounts);
// Thống kê số lượng tài khoản theo vai trò
router.get("/stats/role", authMiddleware, isAdminOrSuperAdmin, AccountController.countByRole);
// Tìm kiếm tài khoản theo username hoặc số điện thoại
router.get("/search", authMiddleware, isAdminOrSuperAdmin, AccountController.searchAccounts);
// Người dùng tự cập nhật thông tin cơ bản của mình (username, phoneNumber)
router.put("/update-basic/:id", authMiddleware, isSelfOrAdmin, validateUpdateBasicInfo, AccountController.updateBasicInfo);

// Lấy tài khoản theo ID
router.get("/:id", authMiddleware, isSelfOrAdmin, AccountController.getAccountById);

export default router;
