import { body } from "express-validator";

export const validateUpdateBasicInfo = [
  body("username")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 4 })
    .withMessage("Tên đăng nhập phải có ít nhất 4 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Tên đăng nhập chỉ được chứa chữ, số hoặc gạch dưới"),

  body("phoneNumber")
    .optional({ nullable: true })
    .trim()
    .matches(/^(0|\+?84)[0-9]{9}$/)
    .withMessage("Số điện thoại không hợp lệ"),
];
