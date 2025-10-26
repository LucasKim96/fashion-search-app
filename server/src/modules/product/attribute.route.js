import express from "express";
import * as AttributeController from "./attribute.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { parseValuesMiddleware } from "../../middlewares/parseValues.middleware.js";
import { isAdminOrSuperAdmin, isShopOwner } from "../../middlewares/role.middleware.js";
import {
  validateCreateAttribute,
  validateUpdateAttribute,
  validateUpdateAttributeLabel,
  validateParamId,
} from "./attribute.validate.js";
import { uploadAttributeImages } from "../../middlewares/uploadAttribute.middleware.js";

const router = express.Router();

// ========================= ADMIN ROUTES =========================
const adminRouter = express.Router();
adminRouter.get("/", AttributeController.getAttributesFlexible);
adminRouter.get("/search", AttributeController.searchGlobalAttributes);
adminRouter.post("/", uploadAttributeImages(),  parseValuesMiddleware, validateCreateAttribute, AttributeController.createGlobalAttribute);
adminRouter.put("/:id", uploadAttributeImages(),  parseValuesMiddleware, validateUpdateAttribute, AttributeController.updateGlobalAttribute);
adminRouter.put("/label/:id", validateParamId, validateUpdateAttributeLabel, AttributeController.updateGlobalAttributeLabel );
router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);

// ========================= SHOP ROUTES =========================
const shopRouter = express.Router();
shopRouter.get("/", AttributeController.getAttributesFlexible);
shopRouter.get("/search", AttributeController.searchShopAttributes);
shopRouter.post("/", uploadAttributeImages(),  parseValuesMiddleware, validateCreateAttribute, AttributeController.createShopAttribute);
shopRouter.put("/:id", uploadAttributeImages(),  parseValuesMiddleware, validateUpdateAttribute, AttributeController.updateShopAttribute);
shopRouter.put("/label/:id", validateParamId, validateUpdateAttributeLabel, AttributeController.updateShopAttributeLabel );
router.use("/shop", authMiddleware, isShopOwner, shopRouter);

// ========================= PUBLIC ROUTES =========================
const publicRouter = express.Router();
publicRouter.get("/:id", validateParamId, AttributeController.getAttributeById);
publicRouter.delete("/:id", validateParamId, AttributeController.deleteGlobalAttribute);
publicRouter.patch("/toggle/:id", validateParamId, AttributeController.toggleGlobalAttribute);
router.use("/", authMiddleware, publicRouter);

export default router;
