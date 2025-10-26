// server/src/utils/apiResponse.js

/**
 * Gửi response thành công chuẩn
 * @param {object} res - Express response object
 * @param {any} data - dữ liệu trả về
 * @param {string} message - thông báo, default "Success"
 * @param {number} statusCode - HTTP status code, default 200
 */
export const successResponse = (
  res,
  data,
  message = "Success",
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data: data !== undefined ? data : null, // đảm bảo luôn có field data
  });
};

/**
 * Gửi response lỗi chuẩn
 * @param {object} res - Express response object
 * @param {Error|string} error - Error object hoặc string
 * @param {number} statusCode - HTTP status code, default 500
 * @param {object} details - Thông tin chi tiết cho frontend
 */
export const errorResponse = (res, error, statusCode = 500, details = null) => {
  const message = error instanceof Error ? error.message : String(error);

  const response = {
    success: false,
    message: message || "Error",
    data: null,
  };

  // Thêm details nếu có (đặc biệt hữu ích cho 404)
  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};
