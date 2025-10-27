// server/src/modules/shop/shop.routes.js
import express from "express";
import * as ShopController from "./shop.controller.js";
import { validateShop } from "../../middlewares/index.js";
import { authMiddleware } from "../../middlewares/index.js";
import { isAdminOrSuperAdmin } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/index.js";

const router = express.Router();

// Public
router.get("/", ShopController.getShops);
router.get("/:id", ShopController.getShop);

// Protected (chủ shop)
router.use(authMiddleware);
router.post("/", validateShop, ShopController.addShop);
router.put("/:id", validateShop, ShopController.editShop);
router.delete("/:id", ShopController.removeShop);
router.put("/:id/status", ShopController.changeStatus);
router.put("/:id/logo", upload.single("logo"), ShopController.updateLogo);
router.put("/:id/cover", upload.single("cover"), ShopController.updateCover);

// Admin
router.use(isAdminOrSuperAdmin);
router.put("/:id/restore", ShopController.restoreShop);

// Super Admin only
router.delete("/cleanup/null-accounts", ShopController.deleteNullShops);

export default router;
