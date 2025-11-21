import express from "express";
import * as AttributeController from "./attribute.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
	isAdminOrSuperAdmin,
	isShopOwner,
} from "../../middlewares/role.middleware.js";
import {
	validateCreateAttribute,
	validateUpdateAttribute,
	validateUpdateAttributeLabel,
	validateParamId,
} from "./attribute.validate.js";
import { uploadAttributeValueImages } from "../../middlewares/index.js";

const router = express.Router();

// ========================= ADMIN ROUTES =========================
const adminRouter = express.Router();
adminRouter.get("/", AttributeController.getAttributesFlexibleAdmin);
adminRouter.get("/search", AttributeController.searchGlobalAttributes);
adminRouter.post(
	"/",
	uploadAttributeValueImages,
	validateCreateAttribute,
	AttributeController.createGlobalAttribute
);
// adminRouter.put("/:id", uploadAttributeValueImages, validateUpdateAttribute, AttributeController.updateGlobalAttribute);
adminRouter.put(
	"/label/:id",
	validateParamId,
	validateUpdateAttributeLabel,
	AttributeController.updateGlobalAttributeLabel
);
adminRouter.delete(
	"/:id",
	validateParamId,
	AttributeController.deleteAttributeByAdmin
);
adminRouter.patch(
	"/toggle/:id",
	validateParamId,
	AttributeController.toggleAttributeByAdmin
);
router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);
// ========================= SHOP ROUTES =========================
const shopRouter = express.Router();
shopRouter.get("/", AttributeController.getAttributesFlexibleShop);
// Lấy danh sách thuộc tính khả dụng cho shop (chỉ isActive + shop + global đang hoạt động)
shopRouter.get(
	"/available",
	AttributeController.getShopAvailableAttributesController
);
shopRouter.get("/search", AttributeController.searchShopAttributes);
shopRouter.post(
	"/",
	uploadAttributeValueImages,
	validateCreateAttribute,
	AttributeController.createShopAttribute
);
// shopRouter.put("/:id", uploadAttributeValueImages, validateUpdateAttribute, AttributeController.updateShopAttribute);
shopRouter.put(
	"/label/:id",
	validateParamId,
	validateUpdateAttributeLabel,
	AttributeController.updateShopAttributeLabel
);
shopRouter.delete(
	"/:id",
	validateParamId,
	AttributeController.deleteAttributeByShop
);
shopRouter.patch(
	"/toggle/:id",
	validateParamId,
	AttributeController.toggleAttributeByShop
);
shopRouter.get(
	"/available/:id",
	AttributeController.getShopAvailableAttributeByIdController
);

router.use("/shop", authMiddleware, isShopOwner, shopRouter);

// ========================= PUBLIC ROUTES =========================
const publicRouter = express.Router();
publicRouter.get("/:id", validateParamId, AttributeController.getAttributeById);
router.use("/public", publicRouter);

export default router;
