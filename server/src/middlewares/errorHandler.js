// server/src/middlewares/errorHandler.js
import { apiResponse } from "../utils/index.js";
import { ApiError } from "../utils/index.js";

const { errorResponse } = apiResponse;

export const errorHandler = (err, req, res, next) => {
  // 1️⃣ Nếu lỗi là ApiError thì lấy status và message từ nó
  if (err instanceof ApiError) {
    // Xử lý đặc biệt cho lỗi 404 - thêm thông tin hữu ích cho frontend
    if (err.statusCode === 404) {
      return errorResponse(res, err.message, 404, {
        redirect: true,
        type: "not_found",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    }
    return errorResponse(res, err.message, err.statusCode);
  }

  // 2️⃣ Lỗi MongoDB - Duplicate Key (E11000)
  if (err.name === "MongoServerError" && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const message = field
      ? `${field} đã tồn tại trong hệ thống`
      : "Dữ liệu đã tồn tại (duplicate key)";
    return errorResponse(res, message, 409);
  }

  // 3️⃣ Lỗi MongoDB - Cast Error (ObjectId không hợp lệ)
  if (err.name === "CastError") {
    const field = err.path || "ID";
    return errorResponse(res, `${field} không hợp lệ`, 400);
  }

  // 4️⃣ Lỗi MongoDB - Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return errorResponse(res, `Dữ liệu không hợp lệ: ${errors}`, 400);
  }

  // 5️⃣ Lỗi MongoDB - Timeout
  if (err.name === "MongoTimeoutError") {
    return errorResponse(res, "Kết nối database bị timeout", 408);
  }

  // 6️⃣ Lỗi MongoDB - Network
  if (err.name === "MongoNetworkError") {
    return errorResponse(res, "Lỗi kết nối database", 503);
  }

  // 7️⃣ Lỗi JWT
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Token không hợp lệ", 401);
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token đã hết hạn", 401);
  }

  // 8️⃣ Lỗi Syntax (JSON không hợp lệ)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return errorResponse(res, "Dữ liệu JSON không hợp lệ", 400);
  }

  // 9️⃣ Lỗi Multer (upload file)
  if (err.code === "LIMIT_FILE_SIZE") {
    return errorResponse(res, "File quá lớn", 413);
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return errorResponse(res, "File không được phép", 400);
  }

  // 🔟 Lỗi còn lại: Internal Server Error
  console.error("Unhandled Error:", err);
  return errorResponse(res, err.message || "Lỗi máy chủ nội bộ", 500);
};

/**
 * Middleware xử lý route không tồn tại (404)
 */
export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, "API endpoint không tồn tại", 404, {
    redirect: true,
    type: "route_not_found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/auth/me",
      "POST /api/auth/change-password",
    ],
    timestamp: new Date().toISOString(),
  });
};
