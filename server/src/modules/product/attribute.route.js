import express from "express";
import * as attributeController from "./attribute.controller.js";
import {
  validateObjectIdParam,
  validateCreateAttribute,
  validateUpdateAttribute,
  validateGetAttributes,
  validateSearchAttributes
} from "./attribute.validate.js";

const router = express.Router();

// GET /attributes - Lấy danh sách attributes
router.get("/", validateGetAttributes, attributeController.getAttributes);

// GET /attributes/search - Tìm kiếm attributes
router.get("/search", validateSearchAttributes, attributeController.searchAttributes);

// GET /attributes/:id - Lấy chi tiết attribute
router.get("/:id", validateObjectIdParam("id"), attributeController.getAttributeById);

// POST /attributes - Tạo attribute mới
router.post("/", validateCreateAttribute, attributeController.createAttribute);

// PUT /attributes/:id - Cập nhật attribute
router.put("/:id", validateObjectIdParam("id"), validateUpdateAttribute, attributeController.updateAttribute);

// DELETE /attributes/:id - Xóa attribute
router.delete("/:id", validateObjectIdParam("id"), attributeController.deleteAttribute);

// GET /attributes/shop/:shopId/full - Lấy tất cả attributes cho shop
router.get("/shop/:shopId/full", validateObjectIdParam("shopId"), attributeController.getAttributesForShopFull);

export default router;
