import express from "express";
import * as OrderController from "./order.controller.js";
import { authMiddleware } from "../../middlewares/index.js";
import {
  isShopOrAdmin,
  isAdminOrSuperAdmin,
} from "../../middlewares/role.middleware.js";

const router = express.Router();

const buyerRouter = express.Router();
buyerRouter.use(authMiddleware);

buyerRouter.get("/", OrderController.getMyOrders);
buyerRouter.post("/create-from-cart", OrderController.createFromCart);
buyerRouter.get("/:id", OrderController.getMyOrderDetail);
buyerRouter.patch("/:id/confirm", OrderController.confirmReceived);
buyerRouter.post("/:id/report", OrderController.reportIssue);
buyerRouter.patch("/:id/cancel", OrderController.cancelMyOrder);

router.use("/buyer", buyerRouter);

const sellerRouter = express.Router();

sellerRouter.use(authMiddleware, isShopOrAdmin);
sellerRouter.get("/", OrderController.getShopOrders);
sellerRouter.patch("/:id/pack", OrderController.markPacking);
sellerRouter.patch("/:id/ship", OrderController.markShipping);
sellerRouter.patch("/:id/deliver", OrderController.markDelivered);
sellerRouter.patch("/:id/cancel", OrderController.cancelBySeller);

router.use("/seller", sellerRouter);

const adminRouter = express.Router();
adminRouter.use(authMiddleware, isAdminOrSuperAdmin);

adminRouter.patch("/:id/complete", OrderController.adminCompleteOrder);
adminRouter.patch("/:id/cancel", OrderController.adminCancelOrder);
adminRouter.post("/:id/review-report", OrderController.reviewReportedOrder);
adminRouter.post("/auto/transition", OrderController.autoTransitionOrders);

router.use("/admin", adminRouter);

export default router;
