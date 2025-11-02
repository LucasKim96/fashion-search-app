import express from "express";
import * as OrderController from "./order.controller.js";
import { authMiddleware } from "../../middlewares/index.js";
import {
  isSellerOrAdmin,
  isAdminOrSuperAdmin,
} from "../../middlewares/role.middleware.js";

const router = express.Router();

const buyerRouter = express.Router();
buyerRouter.use(authMiddleware);

buyerRouter.get("/", OrderController.getMyOrders);
buyerRouter.post("/create-from-cart", OrderController.createFromCart);
buyerRouter.get("/:id", OrderController.getMyOrderDetail);
buyerRouter.post("/:id/confirm", OrderController.confirmReceived);
buyerRouter.post("/:id/report", OrderController.reportIssue);
buyerRouter.post("/:id/cancel", OrderController.cancelMyOrder);

router.use("/buyer", buyerRouter);

const sellerRouter = express.Router();

sellerRouter.use(authMiddleware, isSellerOrAdmin);
sellerRouter.get("/", OrderController.getShopOrders);
sellerRouter.post("/:id/pack", OrderController.markPacking);
sellerRouter.post("/:id/ship", OrderController.markShipping);
sellerRouter.post("/:id/deliver", OrderController.markDelivered);
sellerRouter.post("/:id/cancel", OrderController.cancelBySeller);

router.use("/seller", sellerRouter);

const adminRouter = express.Router();
adminRouter.use(authMiddleware, isAdminOrSuperAdmin);

adminRouter.post("/:id/complete", OrderController.adminCompleteOrder);
adminRouter.post("/:id/cancel", OrderController.adminCancelOrder);
adminRouter.post("/:id/review-report", OrderController.reviewReportedOrder);
adminRouter.post("/auto/transition", OrderController.autoTransitionOrders);

router.use("/admin", adminRouter);

export default router;
