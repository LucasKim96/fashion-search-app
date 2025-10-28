// server/src/modules/shop/shop.routes.js
import express from "express";
import * as ShopController from "./shop.controller.js";
import {
  validateShop,
  uploadShopImage,
  authMiddleware,
  uploadShopDefaultImage,
} from "../../middlewares/index.js";
import { isAdminOrSuperAdmin } from "../../middlewares/role.middleware.js";

const router = express.Router();

// Public Route (Ai cũng xài được)
router.get("/", ShopController.getShops);
router.get("/:id", ShopController.getShop);

// Owner Routes
const ownerRouter = express.Router();
ownerRouter.use(authMiddleware);

ownerRouter.post("/", validateShop, ShopController.addShop);
ownerRouter.put("/:id", validateShop, ShopController.editShop);
ownerRouter.delete("/:id", ShopController.removeShop);
ownerRouter.put("/:id/status", ShopController.changeStatus);
ownerRouter.put(
  "/:id/logo",
  uploadShopImage.single("logo"),
  ShopController.updateLogo
);
ownerRouter.put(
  "/:id/cover",
  uploadShopImage.single("cover"),
  ShopController.updateCover
);

// Mount owner routes under prefix
router.use("/owner", ownerRouter);

// Admin Routes
const adminRouter = express.Router();
adminRouter.use(authMiddleware, isAdminOrSuperAdmin); // xác thực + check quyền

adminRouter.put("/:id/restore", ShopController.restoreShop);

adminRouter.put(
  "/default-logo",
  uploadShopDefaultImage.single("defaultLogo"),
  ShopController.updateDefaultLogo
);
adminRouter.put(
  "/default-cover",
  uploadShopDefaultImage.single("defaultCover"),
  ShopController.updateDefaultCover
);

// Super Admin Only
adminRouter.delete("/cleanup/null-accounts", ShopController.deleteNullShops);

// Mount admin routes under prefix
router.use("/admin", adminRouter);

export default router;
