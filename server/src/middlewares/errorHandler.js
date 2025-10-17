// server/src/middlewares/errorHandler.js
import { errorResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

export const errorHandler = (err, req, res, next) => {
  // Nếu lỗi là ApiError thì lấy status và message từ nó
  if (err instanceof ApiError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  // Nếu là lỗi MongoDB (duplicate key, cast error, validation error)
  if (err.name === "MongoServerError" && err.code === 11000) {
    return errorResponse(res, "Dữ liệu đã tồn tại (duplicate key)", 409);
  }

  if (err.name === "CastError") {
    return errorResponse(res, "ID không hợp lệ", 400);
  }

  // Nếu là lỗi validation từ mongoose
  if (err.name === "ValidationError") {
    return errorResponse(res, err.message, 400);
  }

  // Lỗi còn lại: Internal Server Error
  console.error("Unhandled Error:", err);
  return errorResponse(res, err.message || "Lỗi máy chủ", 500);
};
