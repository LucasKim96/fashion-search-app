import express from "express";
import * as CartController from "./cart.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", CartController.getCart);
router.post("/add", CartController.addItem);
router.put("/update", CartController.updateQuantity);
router.delete("/remove/:productVariantId", CartController.removeItem);
router.delete("/clear", CartController.clearCart);
router.get("/refresh", CartController.refreshCart); // load lại giá, stock
router.post("/bulk-add", CartController.bulkAdd);

export default router;
