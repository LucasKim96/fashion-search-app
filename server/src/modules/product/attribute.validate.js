import { body, param, query } from "express-validator";

// Validate ObjectId parameter
export const validateObjectIdParam = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} không hợp lệ`)
];

// Validate create attribute
export const validateCreateAttribute = [
  body("label")
    .notEmpty()
    .withMessage("Label attribute không được để trống")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Label attribute phải có từ 2-50 ký tự"),

  body("isGlobal")
    .optional()
    .isBoolean()
    .withMessage("isGlobal phải là boolean"),

  body("shopId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Shop ID không hợp lệ"),

  body("values")
    .optional()
    .isArray({ max: 50 })
    .withMessage("Values phải là mảng và không quá 50 phần tử"),

  body("values.*.value")
    .optional()
    .notEmpty()
    .withMessage("Giá trị attribute không được để trống")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Giá trị attribute phải có từ 1-100 ký tự"),

  body("values.*.priceAdjustment")
    .optional()
    .isNumeric()
    .withMessage("priceAdjustment phải là số")
    .isFloat({ min: -999999, max: 999999 })
    .withMessage("priceAdjustment phải trong khoảng -999,999 đến 999,999"),

  body("values.*.image")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("URL ảnh không được vượt quá 500 ký tự"),

  body("values.*.shopId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Shop ID trong value không hợp lệ"),
];

// Validate update attribute
export const validateUpdateAttribute = [
  body("label")
    .optional()
    .notEmpty()
    .withMessage("Label không được để trống")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Label phải có từ 2-50 ký tự"),

  body("isGlobal")
    .optional()
    .isBoolean()
    .withMessage("isGlobal phải là boolean"),

  body("shopId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Shop ID không hợp lệ"),

  body("values")
    .optional()
    .isArray({ max: 50 })
    .withMessage("Values phải là mảng và không quá 50 phần tử"),

  body("values.*.value")
    .optional()
    .notEmpty()
    .withMessage("Giá trị attribute không được để trống")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Giá trị attribute phải có từ 1-100 ký tự"),

  body("values.*.priceAdjustment")
    .optional()
    .isNumeric()
    .withMessage("priceAdjustment phải là số")
    .isFloat({ min: -999999, max: 999999 })
    .withMessage("priceAdjustment phải trong khoảng -999,999 đến 999,999"),

  body("values.*.image")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("URL ảnh không được vượt quá 500 ký tự"),

  body("values.*.shopId")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Shop ID trong value không hợp lệ"),
];

// Validate get attributes query
export const validateGetAttributes = [
  query("isGlobal")
    .optional()
    .isBoolean()
    .withMessage("isGlobal phải là boolean"),

  query("shopId")
    .optional()
    .isMongoId()
    .withMessage("Shop ID không hợp lệ"),

  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page phải là số từ 1 đến 10,000"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit phải là số từ 1 đến 100"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "label"])
    .withMessage("sortBy chỉ được là: createdAt, updatedAt, label"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder chỉ được là: asc, desc"),
];

// Validate search attributes query
export const validateSearchAttributes = [
  query("query")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Từ khóa tìm kiếm không được vượt quá 100 ký tự"),

  query("isGlobal")
    .optional()
    .isBoolean()
    .withMessage("isGlobal phải là boolean"),

  query("shopId")
    .optional()
    .isMongoId()
    .withMessage("Shop ID không hợp lệ"),

  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page phải là số từ 1 đến 10,000"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit phải là số từ 1 đến 100"),
];
