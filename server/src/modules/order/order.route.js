// server/src/modules/order/order.route.js
import express from "express";
import * as OrderController from "./order.controller.js";
// import { verifyToken, verifyAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// TODO: Uncomment khi đã có middleware auth
// router.use(verifyToken);

// User routes
router.post("/", OrderController.createOrder);
router.get("/my-orders", OrderController.getMyOrders);
router.get("/:id", OrderController.getOrderDetail);
router.put("/:id/cancel", OrderController.cancelOrder);

// Shop/Admin routes
// TODO: Thêm middleware verifyShopOwner hoặc verifyAdmin
router.put("/:id/status", OrderController.updateOrderStatus);
router.get("/shop/:shopId/stats", OrderController.getShopOrderStats);

export default router;
