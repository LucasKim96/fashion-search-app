import { body } from "express-validator";

export const createProductValidator = [
  body("pdName")
    .trim()
    .notEmpty().withMessage("Tên sản phẩm không được để trống")
    .isLength({ min: 2, max: 200 }).withMessage("Tên sản phẩm phải từ 2–200 ký tự"),

  body("basePrice")
    .notEmpty().withMessage("Giá cơ bản là bắt buộc")
    .isFloat({ min: 0 }).withMessage("Giá cơ bản phải là số >= 0"),

  body("description")
    .optional()
    .isString().withMessage("Mô tả phải là chuỗi"),

  body("images")
    .optional()
    .isArray().withMessage("Danh sách ảnh phải là mảng")
    .custom((arr) => arr.every((img) => typeof img === "string"))
    .withMessage("Mỗi ảnh phải là chuỗi URL hợp lệ"),

];

export const updateProductValidator = [
  body("pdName")
    .optional()
    .isString().withMessage("Tên sản phẩm phải là chuỗi")
    .isLength({ min: 2, max: 200 }).withMessage("Tên sản phẩm phải từ 2–200 ký tự"),

  body("basePrice")
    .optional()
    .isFloat({ min: 0 }).withMessage("Giá cơ bản phải là số >= 0"),

  body("description")
    .optional()
    .isString().withMessage("Mô tả phải là chuỗi"),

  body("isActive")
    .optional()
    .isBoolean().withMessage("Trạng thái hoạt động phải là boolean"),
];
