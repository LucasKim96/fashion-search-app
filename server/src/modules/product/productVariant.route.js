import express from "express";
import * as ProductVariantController from "./productVariant.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { isShopOwner } from "../../middlewares/role.middleware.js";
import { uploadVariant, uploadProduct } from "../../middlewares/index.js";

const router = express.Router();

const shopRouter = express.Router();
// Sinh tổ hợp biến thể mới (shop)
shopRouter.post(
	"/generate",
	ProductVariantController.generateVariantCombinations
);
// Sinh tổ hợp biến thể mới (shop)
shopRouter.post(
	"/generate-new",
	ProductVariantController.generateNewVariantCombinations
);
// Lấy danh sách attribute + value (có isUsed) cho sản phẩm
shopRouter.get(
	"/attributes/:productId",
	ProductVariantController.getProductAttributesWithValues
);
// Tạo nhiều biến thể cùng lúc (bulk create)
shopRouter.post(
	"/bulk",
	uploadProduct, // cho phép nhiều ảnh khi bulk
	ProductVariantController.createProductVariantsBulk
);
// Cập nhật 1 biến thể
shopRouter.put(
	"/:variantId",
	uploadVariant.single("image"), // chỉ 1 file duy nhất
	ProductVariantController.UpdateProductVariant
);
router.use("/", authMiddleware, isShopOwner, shopRouter);

export default router;
