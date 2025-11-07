import mongoose from "mongoose";
import ApiError from "./apiError.js";

/**
 * Kiểm tra ObjectId hợp lệ (dùng cho MongoDB)
 * @param {string} id - ID cần kiểm tra
 * @param {string} name - Tên trường (để hiển thị trong thông báo lỗi)
 */
export const validateObjectId = (id, name = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`${name} không hợp lệ`);
  }
};

/**
 * Kiểm tra URL hợp lệ
 */
export const validateURL = (url, field = "URL", required = false) => {
  const urlRegex =
    /^(https?:\/\/)([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;

  if (!url || !url.trim()) {
    if (required) throw ApiError.badRequest(`${field} là bắt buộc`);
    return; // không cần check nếu không bắt buộc
  }

  if (!urlRegex.test(url.trim())) {
    throw ApiError.badRequest(`${field} không hợp lệ`);
  }
};

/**
 * Kiểm tra email hợp lệ
 */
export const validateEmail = (email) => {
  const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw ApiError.badRequest("Email không hợp lệ");
  }
};

/**
 * Kiểm tra số điện thoại (Việt Nam)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    throw ApiError.badRequest("Số điện thoại không hợp lệ");
  }
};
