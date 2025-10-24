import * as attributeService from "./attribute.service.js";
import { validationResult } from "express-validator";

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: errors.array()
    });
  }
  next();
};

// GET /attributes - Lấy danh sách attributes
export const getAttributes = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const { isGlobal, shopId, page, limit, sortBy, sortOrder } = req.query;
      const result = await attributeService.getAttributes({
        isGlobal: isGlobal === 'true' ? true : isGlobal === 'false' ? false : undefined,
        shopId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy,
        sortOrder
      });
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];

// GET /attributes/search - Tìm kiếm attributes
export const searchAttributes = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const { query, isGlobal, shopId, page, limit } = req.query;
      const result = await attributeService.searchAttributes({
        query,
        isGlobal: isGlobal === 'true' ? true : isGlobal === 'false' ? false : undefined,
        shopId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];

// GET /attributes/:id - Lấy chi tiết attribute
export const getAttributeById = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await attributeService.getAttributeById(id);
      
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];

// POST /attributes - Tạo attribute mới
export const createAttribute = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await attributeService.createAttribute(req.body);
      
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];

// PUT /attributes/:id - Cập nhật attribute
export const updateAttribute = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await attributeService.updateAttribute(id, req.body);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];

// DELETE /attributes/:id - Xóa attribute
export const deleteAttribute = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await attributeService.deleteAttribute(id);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];

// GET /attributes/shop/:shopId/full - Lấy tất cả attributes cho shop
export const getAttributesForShopFull = [
  handleValidationErrors,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const result = await attributeService.getAttributesForShopFull(shopId);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message
      });
    }
  }
];
