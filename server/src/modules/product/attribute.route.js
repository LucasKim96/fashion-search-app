import express from "express";
import * as AttributeController from "./attribute.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { isAdminOrSuperAdmin, isShopOwner } from "../../middlewares/role.middleware.js";
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
adminRouter.get("/", AttributeController.getAttributesFlexible);
adminRouter.get("/search", AttributeController.searchGlobalAttributes);
adminRouter.post("/", uploadAttributeValueImages, validateCreateAttribute, AttributeController.createGlobalAttribute);
// adminRouter.put("/:id", uploadAttributeValueImages, validateUpdateAttribute, AttributeController.updateGlobalAttribute);
adminRouter.put("/label/:id", validateParamId, validateUpdateAttributeLabel, AttributeController.updateGlobalAttributeLabel );
router.use("/admin", authMiddleware, isAdminOrSuperAdmin, adminRouter);

// ========================= SHOP ROUTES =========================
const shopRouter = express.Router();
shopRouter.get("/", AttributeController.getAttributesFlexible);
shopRouter.get("/search", AttributeController.searchShopAttributes);
shopRouter.post("/", uploadAttributeValueImages, validateCreateAttribute, AttributeController.createShopAttribute);
// shopRouter.put("/:id", uploadAttributeValueImages, validateUpdateAttribute, AttributeController.updateShopAttribute);
shopRouter.put("/label/:id", validateParamId, validateUpdateAttributeLabel, AttributeController.updateShopAttributeLabel );
router.use("/shop", authMiddleware, isShopOwner, shopRouter);

// ========================= PUBLIC ROUTES =========================
const publicRouter = express.Router();
publicRouter.get("/:id", validateParamId, AttributeController.getAttributeById);
publicRouter.delete("/:id", validateParamId, AttributeController.deleteGlobalAttribute);
publicRouter.patch("/toggle/:id", validateParamId, AttributeController.toggleGlobalAttribute);
router.use("/", authMiddleware, publicRouter);

export default router;
