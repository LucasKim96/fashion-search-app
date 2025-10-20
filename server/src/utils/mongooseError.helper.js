// server/src/utils/mongooseError.helper.js
import ApiError from "./apiError.js";

/**
 * Chuẩn hoá lỗi Mongoose để trả về message thân thiện & có mã lỗi phù hợp
 * Dùng kèm trong transaction hoặc service
 * @param {Error} err
 * @returns {Error}
 */
export const handleMongooseError = (err) => {
  // Duplicate key error (code 11000)
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const value = err.keyValue?.[field];
    const msg = `Giá trị '${value}' cho trường '${field}' đã tồn tại.`;
    throw ApiError.conflict(msg);
  }

  // ValidationError (schema validation fail)
  if (err?.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    throw ApiError.badRequest(`Dữ liệu không hợp lệ: ${messages}`);
  }

  // CastError (invalid ObjectId)
  if (err?.name === "CastError") {
    throw ApiError.badRequest(
      `Giá trị '${err.value}' của ${err.path} không hợp lệ`
    );
  }

  // DocumentNotFoundError
  if (err?.name === "DocumentNotFoundError") {
    throw ApiError.notFound(`Không tìm thấy dữ liệu`);
  }

  // Nếu không thuộc các loại trên thì trả về lỗi gốc hoặc bọc lại
  if (err instanceof ApiError) throw err;
  throw ApiError.internal(err.message || "Lỗi hệ thống không xác định");
};
