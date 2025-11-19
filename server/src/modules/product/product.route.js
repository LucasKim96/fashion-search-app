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

// ========================= PUBLIC ROUTES =========================
const publicRouter = express.Router();

// 1. Các route tĩnh (Specific) - Đặt lên đầu
publicRouter.get("/", ProductController.getAllPublicProducts);
publicRouter.get("/shop", ProductController.getShopPublicProducts);
publicRouter.get("/count/:shopId", ProductController.countProductsByShop);
publicRouter.get("/:productId", ProductController.getProductDetail);

router.use("/", publicRouter);

export default router;

// import express from "express";
// import * as ProductController from "./product.controller.js";
// import { authMiddleware } from "../../middlewares/auth.middleware.js";
// import {
// 	isAdminOrSuperAdmin,
// 	isShopOwner,
// } from "../../middlewares/role.middleware.js";
// import {
// 	createProductValidator,
// 	updateProductValidator,
// } from "./product.validate.js";
// import { uploadProductImages, uploadProduct } from "../../middlewares/index.js";

// const router = express.Router();
// // ========================= PUBLIC ROUTES =========================
// const publicRouter = express.Router();
// // Lấy toàn bộ sản phẩm hiển thị (toàn hệ thống)
// publicRouter.get("/", ProductController.getAllPublicProducts);
// // Lấy sản phẩm hiển thị theo shop (?shopId=...)
// publicRouter.get("/shop", ProductController.getShopPublicProducts);
// // Xem chi tiết sản phẩm
// publicRouter.get("/:productId", ProductController.getProductDetail);
// // Xem số lượng sản phẩm hiển thị của shop
// publicRouter.get("/count/:shopId", ProductController.countProductsByShop);
// router.use("/", publicRouter);

// // ========================= ADMIN ROUTES =========================
// const adminRouter = express.Router();
// adminRouter.get("/search", ProductController.searchProductsAdmin);
// adminRouter.get("/count", ProductController.countAllProducts);

// adminRouter.patch(
// 	"/toggle/:productId",
// 	ProductController.toggleProductActiveAuto
// );
// adminRouter.delete("/:productId", ProductController.deleteProductWithVariants);
// adminRouter.get("/", ProductController.getAllProductsAdmin);
// adminRouter.get("/:productId", ProductController.getProductDetail);
// router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);

// // ========================= SHOP ROUTES =========================
// const shopRouter = express.Router();
// shopRouter.get("/search", ProductController.searchProductsShop);
// // Lấy toàn bộ sản phẩm của shop (kể cả ẩn)
// shopRouter.get("/", ProductController.getShopProducts);
// // Xem số lượng sản phẩm của shop
// shopRouter.get("/count", ProductController.countMyProducts);
// // Tạo sản phẩm mới (kèm biến thể & ảnh)
// shopRouter.post(
// 	"/create",
// 	uploadProduct,
// 	createProductValidator,
// 	ProductController.createProductWithVariants
// );
// // Cập nhật thông tin cơ bản
// shopRouter.put(
// 	"/basic/:productId",
// 	updateProductValidator,
// 	ProductController.updateProductBasicInfo
// );
// // Cập nhật ảnh sản phẩm
// shopRouter.put(
// 	"/images/:productId",
// 	uploadProductImages,
// 	ProductController.updateProductImages
// );
// // Bật/tắt trạng thái sản phẩm
// shopRouter.patch(
// 	"/toggle/:productId",
// 	ProductController.toggleProductActiveAuto
// );
// // Xóa sản phẩm (kèm biến thể)
// shopRouter.delete("/:productId", ProductController.deleteProductWithVariants);
// router.use("/shop", authMiddleware, isShopOwner, shopRouter);

// export default router;
