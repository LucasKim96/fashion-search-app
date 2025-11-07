// server/src/utils/ApiError.js

export default class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Yêu cầu không hợp lệ", details) {
    return new ApiError(message, 400, details);
  }

  static unauthorized(message = "Không có quyền truy cập") {
    return new ApiError(message, 401);
  }

  static forbidden(message = "Bị từ chối truy cập") {
    return new ApiError(message, 403);
  }

  static notFound(message = "Không tìm thấy tài nguyên") {
    return new ApiError(message, 404);
  }

  static conflict(message = "Xung đột dữ liệu", details) {
    return new ApiError(message, 409, details);
  }

  static internal(message = "Lỗi máy chủ") {
    return new ApiError(message, 500);
  }
}
