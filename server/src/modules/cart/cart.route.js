import express from "express";
import * as CartController from "./cart.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
// GET /api/carts/mine - Lấy giỏ hàng của user đang đăng nhập
router.get("/mine", CartController.getCart);

// DELETE /api/carts/mine - Xóa toàn bộ giỏ hàng của user
router.delete("/mine", CartController.clearCart);

// POST /api/carts/items - Thêm một item mới vào giỏ
router.post("/items", CartController.addItem);

// PUT /api/carts/items/:productVariantId - Cập nhật số lượng của một item
router.put("/items/:productVariantId", CartController.updateQuantity);

// DELETE /api/carts/items/:productVariantId - Xóa một item khỏi giỏ
router.delete("/items/:productVariantId", CartController.removeItem);
router.get("/refresh", CartController.refreshCart); // load lại giá, stock
router.post("/bulk-add", CartController.bulkAdd);

export default router;
