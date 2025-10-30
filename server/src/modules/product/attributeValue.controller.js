// server/src/modules/product/attributeValue.controller.js
import fs from "fs";
import path from "path";
import * as AttributeValueService from "./attributeValue.service.js";
import { attachImagesByFileKey, rollbackFiles } from "../../utils/index.js";
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const ATTRIBUTE_FOLDER = path.join(UPLOADS_ROOT, "attributes");
export const ATTRIBUTE_PUBLIC = "/uploads/attributes";

const handleCreateAttributeValue = async (req, res, isAdmin = false) => {
  const tempFiles = [];

  try {
    const attributeId = req.params.attributeId;
    if (!attributeId)
      return res.status(400).json({
        success: false,
        message: "Thiếu attributeId",
      });

    const accountId = isAdmin ? null : req.user?.id;

    // Gắn ảnh với values — có tempFiles để rollback nếu lỗi
    const values = attachImagesByFileKey(req, "values", tempFiles, {
      baseFolder: ATTRIBUTE_FOLDER,
      publicPath: ATTRIBUTE_PUBLIC,
    });

    // Gọi service xử lý business logic và rollback trong đó
    const result = await AttributeValueService.createAttributeValues(
      attributeId,
      values,
      accountId,
      tempFiles // truyền tempFiles vào service để rollback nếu DB lỗi
    );

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    // console.error("Lỗi khi tạo Attribute Value:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể tạo Attribute Value",
    });
  }
};

const handleUpdateAttributeValue = async (req, res, { isAdmin = false }) => {
  try {
    const valueId = req.params.valueId;
    const accountId = !isAdmin ? req.user?.id : null; // Chỉ có shop mới cần accountId
    const file = req.file; // ảnh mới (nếu có)
    const payload = { ...req.body };

    // --- Gọi service ---
    const result = await AttributeValueService.updateAttributeValue(
      valueId,
      payload,
      accountId,
      file
    );

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const handleToggleAttributeValue = async (req, res, { isAdmin = false }) => {
  try {
    const valueId = req.params.valueId;
    const accountId = !isAdmin ? req.user?.id : null;

    const result = await AttributeValueService.toggleAttributeValueStatus(
      valueId,
      accountId
    );

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const handleDeleteAttributeValue = async (req, res, { isAdmin = false }) => {
  try {
    const valueId = req.params.valueId;
    const accountId = !isAdmin ? req.user?.id : null;

    const result = await AttributeValueService.deleteAttributeValue(valueId, accountId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || "Xóa giá trị thuộc tính thất bại",
      });
    }

    return res.json({success: true, message: result.message });
  } catch (error) {
    // console.error("Lỗi khi xóa attribute value:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server khi xóa giá trị thuộc tính",
    });
  }
};
// --- Controller cho admin ---
export const createAttributeValueAdmin = (req, res) => handleCreateAttributeValue(req, res, true);

export const updateAttributeValueAdmin = (req, res) => handleUpdateAttributeValue(req, res, { isAdmin: true });

export const toggleAttributeValueAdmin = (req, res) => handleToggleAttributeValue(req, res, { isAdmin: true });

export const deleteAttributeValueAdmin = (req, res) => handleDeleteAttributeValue(req, res, { isAdmin: true });

// --- Controller cho shop ---
export const createAttributeValueShop = (req, res) => handleCreateAttributeValue(req, res, false);

export const updateAttributeValueShop = (req, res) => handleUpdateAttributeValue(req, res, { isAdmin: false });

export const toggleAttributeValueShop = (req, res) => handleToggleAttributeValue(req, res, { isAdmin: false });

export const deleteAttributeValueShop = (req, res) => handleDeleteAttributeValue(req, res, { isAdmin: false });