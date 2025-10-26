import express from "express";
import * as AttributeValueController from "./attributeValue.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { isAdminOrSuperAdmin, isShopOwner } from "../../middlewares/role.middleware.js";
import { uploadFiles } from "../../middlewares/upload.middleware.js";
import { uploadAttributeImages } from "../../middlewares/uploadAttribute.middleware.js";
import { parseValuesMiddleware } from "../../middlewares/parseValues.middleware.js";
import { validateCreateAttributeValue } from "./attribute.validate.js";
const router = express.Router();

// --- Middleware upload ---
const uploadAttribute = uploadFiles("attributes");

// ============================= ADMIN ROUTES =============================
const adminRouter = express.Router();
router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);
// Tạo giá trị thuộc tính (1 hoặc nhiều)
adminRouter.post("/:attributeId", uploadAttributeImages(),  parseValuesMiddleware, validateCreateAttributeValue, AttributeValueController.createAttributeValueAdmin);
// Cập nhật giá trị thuộc tính
adminRouter.put( "/:valueId", uploadAttribute.single("image"), AttributeValueController.updateAttributeValueAdmin );
// Bật / Tắt trạng thái
adminRouter.patch("/toggle/:valueId", AttributeValueController.toggleAttributeValueAdmin);
// Xóa giá trị thuộc tính
adminRouter.delete("/:valueId", AttributeValueController.deleteAttributeValueAdmin);

// ============================= SHOP ROUTES =============================
const shopRouter = express.Router();
router.use("/shop", authMiddleware, isShopOwner, shopRouter);
// Tạo giá trị thuộc tính (shop)
shopRouter.post("/:attributeId", uploadAttributeImages(),  parseValuesMiddleware, validateCreateAttributeValue, AttributeValueController.createAttributeValueShop);
// Cập nhật giá trị thuộc tính (shop)
shopRouter.put( "/:valueId", uploadAttribute.single("image"), AttributeValueController.updateAttributeValueShop );
// Bật / Tắt trạng thái (shop)
shopRouter.patch("/toggle/:valueId", AttributeValueController.toggleAttributeValueShop);
// Xóa giá trị thuộc tính (shop)
shopRouter.delete("/:valueId", AttributeValueController.deleteAttributeValueShop);

export default router;
