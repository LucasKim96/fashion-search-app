// server/src/modules/auth/validate.js
import { body } from "express-validator";

export const registerValidator = [
  body("username")
    .notEmpty().withMessage("Tên đăng nhập không được để trống")
    .isLength({ min: 4 }).withMessage("Tên đăng nhập phải có ít nhất 4 ký tự"),
  
  body("phoneNumber")
    .notEmpty().withMessage("Số điện thoại không được để trống")
    .matches(/^(0|\+?84)[0-9]{9}$/).withMessage("Số điện thoại không hợp lệ"),

  body("password")
    .notEmpty().withMessage("Mật khẩu không được để trống")
    .isLength({ min: 8 }).withMessage("Mật khẩu phải có ít nhất 8 ký tự")
    .matches(/[a-z]/).withMessage("Mật khẩu phải có ít nhất 1 chữ thường")
    .matches(/[A-Z]/).withMessage("Mật khẩu phải có ít nhất 1 chữ hoa")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),

  // Trường confirmPassword — kiểm tra trùng mật khẩu (nếu FE có gửi)
  body("confirmPassword").custom((value, { req }) => {
    if (value && value !== req.body.password) {
      throw new Error("Mật khẩu xác nhận không khớp");
    }
    return true;
  }),
];

export const loginValidator = [
  body("usernameOrPhone")
    .notEmpty().withMessage("Tên đăng nhập hoặc số điện thoại không được để trống"),
  
  body("password")
    .notEmpty().withMessage("Mật khẩu không được để trống"),
];

// Validate đổi mật khẩu
export const changePasswordValidator = [
  body("oldPassword")
    .notEmpty().withMessage("Mật khẩu cũ không được để trống"),

  body("newPassword")
    .notEmpty().withMessage("Mật khẩu mới không được để trống")
    .isLength({ min: 8 }).withMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
    .matches(/[a-z]/).withMessage("Mật khẩu mới phải có ít nhất 1 chữ thường")
    .matches(/[A-Z]/).withMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt")
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty().withMessage("Vui lòng nhập lại mật khẩu xác nhận")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return true;
    }),
];
