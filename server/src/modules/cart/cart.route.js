import express from "express";
import * as CartController from "./cart.controller.js";
// import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// router.use(verifyToken);
router.get("/", CartController.getCart);
router.post("/add", CartController.addItem);
router.put("/update", CartController.updateQuantity);
router.delete("/remove/:productVariantId", CartController.removeItem);
router.delete("/clear", CartController.clearCart);

export default router;
