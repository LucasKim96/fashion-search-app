import express from "express";
import * as ProductController from "./product.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
<<<<<<< HEAD
import {
	isAdminOrSuperAdmin,
	isShopOwner,
} from "../../middlewares/role.middleware.js";
import {
	createProductValidator,
	updateProductValidator,
} from "./product.validate.js";
=======
import { isAdminOrSuperAdmin, isShopOwner } from "../../middlewares/role.middleware.js";
import { createProductValidator, updateProductValidator } from "./product.validate.js";
>>>>>>> python/query-text
import { uploadProductImages, uploadProduct } from "../../middlewares/index.js";

const router = express.Router();
// ========================= PUBLIC ROUTES =========================
const publicRouter = express.Router();
// Lấy toàn bộ sản phẩm hiển thị (toàn hệ thống)
publicRouter.get("/", ProductController.getAllPublicProducts);
// Lấy sản phẩm hiển thị theo shop (?shopId=...)
publicRouter.get("/shop", ProductController.getShopPublicProducts);
// Xem chi tiết sản phẩm
publicRouter.get("/:productId", ProductController.getProductDetail);
// Xem số lượng sản phẩm hiển thị của shop
publicRouter.get("/count/:shopId", ProductController.countProductsByShop);
router.use("/", publicRouter);

// ========================= ADMIN ROUTES =========================
const adminRouter = express.Router();
adminRouter.get("/", ProductController.getAllProductsAdmin);
adminRouter.get("/count", ProductController.countAllProducts);
adminRouter.get("/:productId", ProductController.getProductDetail);
adminRouter.patch("/toggle/:productId", ProductController.toggleProductActiveAuto);
adminRouter.delete("/:productId", ProductController.deleteProductWithVariants);

router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);

// ========================= SHOP ROUTES =========================
const shopRouter = express.Router();
// Lấy toàn bộ sản phẩm của shop (kể cả ẩn)
shopRouter.get("/", ProductController.getShopProducts);
// Xem số lượng sản phẩm của shop
shopRouter.get("/count", ProductController.countMyProducts);
// Tạo sản phẩm mới (kèm biến thể & ảnh)
shopRouter.post( "/create", uploadProduct, createProductValidator, ProductController.createProductWithVariants );
// Cập nhật thông tin cơ bản
shopRouter.put( "/basic/:productId", updateProductValidator, ProductController.updateProductBasicInfo );

// Cập nhật ảnh sản phẩm
shopRouter.put( "/images/:productId", uploadProductImages, ProductController.updateProductImages );
// Bật/tắt trạng thái sản phẩm
shopRouter.patch("/toggle/:productId", ProductController.toggleProductActiveAuto);
// Xóa sản phẩm (kèm biến thể)
shopRouter.delete("/:productId", ProductController.deleteProductWithVariants);

router.use("/shop", authMiddleware, isShopOwner, shopRouter);

<<<<<<< HEAD
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

router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);
=======
>>>>>>> python/query-text

export default router;
