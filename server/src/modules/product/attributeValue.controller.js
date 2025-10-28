// server/src/modules/product/attributeValue.controller.js
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import * as AttributeValueService from "./attributeValue.service.js";
import { attachImagesToValues, rollbackFiles} from "../../utils/index.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const attributeUploadDir = path.resolve(__dirname, "../../uploads/attributes");

// --- Helper lưu ảnh ---
/**
 * Lưu file ảnh an toàn (tạo folder nếu chưa có)
 * @param {Buffer} buffer - Dữ liệu file
 * @param {string} folder - Thư mục lưu
 * @param {string} filename - Tên file
 * @returns {{ filePath: string, fileName: string }} - Trả về cả đường dẫn và tên file
 */

const saveFileAtomic = (buffer, folder, filename) => {
  if (!buffer) return null;
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  const filePath = path.join(folder, filename);
  fs.writeFileSync(filePath, buffer);
  return { filePath, fileName: filename };
};


const handleCreateAttributeValue = async (req, res, isAdmin = false) => {
  const tempFiles = [];
  try {
    const attributeId = req.params.attributeId;
    if (!attributeId)
      return res.status(400).json({ success: false, message: "Thiếu attributeId" });

    const accountId = isAdmin ? null : req.user?.id;
    let values = attachImagesToValues(req, tempFiles);

    const result = await AttributeValueService.createAttributeValues(attributeId, values, accountId);

    if (!result.success) rollbackFiles(tempFiles);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const handleUpdateAttributeValue = async (req, res, { isAdmin = false }) => {
  const savedFiles = []; // Danh sách file để rollback nếu lỗi

  try {
    const valueId = req.params.valueId;
    const accountId = !isAdmin ? req.user?.id : null; // Chỉ có shop mới cần accountId
    const payload = { ...req.body };

    // --- Nếu có upload ảnh mới ---
    if (req.file && req.file.buffer) {
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const { filePath, fileName: savedName } = saveFileAtomic(req.file.buffer, attributeUploadDir, fileName);

      payload.image = `/uploads/attributes/${savedName}`;
      savedFiles.push(filePath);
    }

    // --- Gọi service ---
    const result = await AttributeValueService.updateAttributeValue(
      valueId,
      payload,
      accountId
    );

    // --- Kiểm tra kết quả ---
    if (!result) {
      rollbackFiles(savedFiles);
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy giá trị thuộc tính cần cập nhật",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: result,
    });
  } catch (error) {
    rollbackFiles(savedFiles);
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

export const handleDeleteAttributeValue = async (req, res, { isAdmin = false }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const valueId = req.params.valueId;
    const accountId = !isAdmin ? req.user?.id : null;

    const result = await AttributeValueService.deleteAttributeValue(
      valueId,
      accountId,
      session
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Lỗi khi xóa attribute value:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Không thể xóa giá trị thuộc tính",
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