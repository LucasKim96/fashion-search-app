import express from "express";
import * as ProductController from "./product.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
	isAdminOrSuperAdmin,
	isShopOwner,
} from "../../middlewares/role.middleware.js";
import {
	createProductValidator,
	updateProductValidator,
} from "./product.validate.js";
import { uploadProductImages, uploadProduct } from "../../middlewares/index.js";

const router = express.Router();

// ========================= PUBLIC ROUTES =========================
const publicRouter = express.Router();

// Các route bên trong publicRouter sẽ có URL dạng /public/...
publicRouter.get("/", ProductController.getAllPublicProducts);
publicRouter.get("/shop/:shopId", ProductController.getShopPublicProducts);
publicRouter.get("/count/:shopId", ProductController.countProductsByShop);
publicRouter.get("/:productId", ProductController.getProductDetail);

// Gắn publicRouter vào router chính với tiền tố "/public"
// Bất kỳ ai cũng có thể truy cập, không cần authMiddleware
router.use("/public", publicRouter);

// ========================= SHOP ROUTES =========================
const shopRouter = express.Router();

// 1. Route tĩnh
shopRouter.get("/search", ProductController.searchProductsShop);
shopRouter.get("/count", ProductController.countMyProducts);
shopRouter.get("/", ProductController.getShopProducts);
shopRouter.post(
	"/create",
	uploadProduct,
	createProductValidator,
	ProductController.createProductWithVariants
);

// 2. Route động
shopRouter.put(
	"/basic/:productId",
	updateProductValidator,
	ProductController.updateProductBasicInfo
);
shopRouter.put(
	"/images/:productId",
	uploadProductImages,
	ProductController.updateProductImages
);
shopRouter.patch(
	"/toggle/:productId",
	ProductController.toggleProductActiveAuto
);
shopRouter.delete("/:productId", ProductController.deleteProductWithVariants);

router.use("/shop", authMiddleware, isShopOwner, shopRouter);

// ========================= ADMIN ROUTES =========================
const adminRouter = express.Router();

// 1. Route tĩnh
adminRouter.get("/search", ProductController.searchProductsAdmin);
adminRouter.get("/count", ProductController.countAllProducts);

// 2. Route động
adminRouter.patch(
	"/toggle/:productId",
	ProductController.toggleProductActiveAuto
);
adminRouter.delete("/:productId", ProductController.deleteProductWithVariants);
adminRouter.get("/", ProductController.getAllProductsAdmin);
adminRouter.get("/:productId", ProductController.getProductDetail);
// Re-index tất cả sản phẩm lên AI
adminRouter.post("/reindex", ProductController.reindexAll);
adminRouter.post("/reindex-text", ProductController.reindexTextSearch);

router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);

export default router;
