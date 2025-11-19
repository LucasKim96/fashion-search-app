import { body } from "express-validator";

export const validateUpdateBasicUserInfo = [
  body("name")
    .if((value, { req }) => "name" in req.body) // chỉ validate nếu name có trong request
    .trim()
    .isLength({ min: 2 })
    .withMessage("Tên phải có ít nhất 2 ký tự"),

  body("dayOfBirth")
    .if((value, { req }) => "dayOfBirth" in req.body)
    .isISO8601()
    .withMessage("Ngày sinh không hợp lệ")
    .custom((value) => {
      const dob = new Date(value);
      const year = dob.getFullYear();
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 75; 
      const maxYear = currentYear - 14; 
      if (year < minYear || year > maxYear) {
        throw new Error(`Năm sinh phải từ ${minYear} đến ${maxYear}`);
      }
      return true;
    }),

  body("email")
    .if((value, { req }) => "email" in req.body)
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("gender")
    .if((value, { req }) => "gender" in req.body)
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),
];
