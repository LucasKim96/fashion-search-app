// server/src/middlewares/validateShop.js
import { ApiError } from "../utils/index.js";

// Regex cơ bản cho URL (chấp nhận http, https, ftp)
const urlRegex =
  /^(https?:\/\/)([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;

/**
 * Middleware validate dữ liệu Shop (dùng cho tạo / cập nhật)
 */
export const validateShop = (req, res, next) => {
  const { shopName, description, logoUrl, coverUrl } = req.body;

  // Validate shopName
  if (!shopName || typeof shopName !== "string" || !shopName.trim()) {
    throw ApiError.badRequest("Tên shop là bắt buộc!");
  }
  if (shopName.trim().length < 3 || shopName.trim().length > 100) {
    throw ApiError.badRequest("Tên shop phải từ 3 đến 100 ký tự!");
  }

  // Validate description
  // if (!description || typeof description !== "string" || !description.trim()) {
  //   throw ApiError.badRequest("Mô tả shop là bắt buộc!");
  // }
  if (description.trim().length > 1000) {
    throw ApiError.badRequest("Mô tả không được vượt quá 1000 ký tự!");
  }

  // Validate logoUrl (nếu có)
  if (logoUrl && !urlRegex.test(logoUrl)) {
    throw ApiError.badRequest("Logo URL không hợp lệ!");
  }

  // Validate coverUrl (nếu có)
  if (coverUrl && !urlRegex.test(coverUrl)) {
    throw ApiError.badRequest("Ảnh bìa URL không hợp lệ!");
  }

  next();
};
