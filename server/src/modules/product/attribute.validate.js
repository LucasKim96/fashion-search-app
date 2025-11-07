import { body, param } from "express-validator";


export const validateParamId = [
  param("id").isMongoId().withMessage("Id không hợp lệ"),
];

// Validate cho việc tạo mới attribute
export const validateCreateAttribute = [
  body("label")
    .trim()
    .notEmpty()
    .withMessage("Tên thuộc tính (label) là bắt buộc")
    .isLength({ max: 100 })
    .withMessage("Tên thuộc tính không được dài quá 100 ký tự"),

  body("values.*.value")
    .if(body("values").exists())
    .trim()
    .notEmpty()
    .withMessage("Giá trị value không được để trống"),


  body("values.*.image")
    .optional()
    .isString()
    .withMessage("image phải là chuỗi URL hoặc base64"),
];

export const validateCreateAttributeValue = [
  body("values.*.value")
    .if(body("values").exists())
    .trim()
    .notEmpty()
    .withMessage("Giá trị value không được để trống"),

  body("values.*.image")
    .optional()
    .isString()
    .withMessage("image phải là chuỗi URL hoặc base64"),
];
// Validate cho việc cập nhật attribute
export const validateUpdateAttribute = [
  body("label")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Tên thuộc tính không được để trống nếu có"),

  body("values.*._id")
    .optional()
    .isString()
    .withMessage("_id của value phải là chuỗi"),

  body("values.*._action")
    .optional()
    .isIn(["toggle-status", "delete", "update", "insert"])
    .withMessage("_action không hợp lệ (chỉ nhận toggle-status|delete|update|insert)"),

  body("values.*.value")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Giá trị value không được để trống"),


  body("values.*.image")
    .optional()
    .isString()
    .withMessage("image phải là chuỗi URL hoặc base64"),
];

export const validateUpdateAttributeLabel = [
  body("label")
    .exists({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage("Tên thuộc tính không được để trống"),
];