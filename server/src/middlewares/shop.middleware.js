// server/src/middlewares/validateShop.js
import { errorResponse } from "../utils/apiResponse.js";

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
    return errorResponse(res, "Tên shop là bắt buộc!", 400);
  }
  if (shopName.trim().length < 3 || shopName.trim().length > 100) {
    return errorResponse(res, "Tên shop phải từ 3 đến 100 ký tự!", 400);
  }

  // Validate description
  if (!description || typeof description !== "string" || !description.trim()) {
    return errorResponse(res, "Mô tả shop là bắt buộc!", 400);
  }
  if (description.trim().length < 10 || description.trim().length > 500) {
    return errorResponse(res, "Mô tả phải từ 10 đến 500 ký tự!", 400);
  }

  // Validate logoUrl (nếu có)
  if (logoUrl && !urlRegex.test(logoUrl)) {
    return errorResponse(res, "Logo URL không hợp lệ!", 400);
  }

  // Validate coverUrl (nếu có)
  if (coverUrl && !urlRegex.test(coverUrl)) {
    return errorResponse(res, "Ảnh bìa URL không hợp lệ!", 400);
  }

  next(); // ✅ hợp lệ, chuyển tiếp controller
};
