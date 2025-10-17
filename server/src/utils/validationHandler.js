import { validationResult } from "express-validator";

/**
 * Xử lý kết quả validate từ express-validator
 * @param {Request} req 
 * @returns {object|null} null nếu không có lỗi, hoặc object {success, message}
 */
export const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return {
      success: false,
      message: errors.array()[0].msg, // chỉ lấy lỗi đầu tiên
    };
  }
  return null;
};
