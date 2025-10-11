// server/src/modules/shop/shop.routes.js
import express from "express";
import * as ShopController from "./shop.controller.js";
// import { verifyToken, verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.get("/", ShopController.getShops);
router.get("/:id", ShopController.getShop);

// Protected (chủ shop)
// router.use(verifyToken);
router.post("/", ShopController.addShop);
router.put("/:id", ShopController.editShop);
router.delete("/:id", ShopController.removeShop);

// Admin
// router.use(verifyAdmin);
router.put("/:id/status", ShopController.changeStatus);

export default router;
