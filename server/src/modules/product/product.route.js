// Product Routes
import express from "express";
import * as productController from "./product.controller.js";

const router = express.Router();

router.get("/", productController.getProducts);
router.post("/", productController.addProduct);

export default router;
