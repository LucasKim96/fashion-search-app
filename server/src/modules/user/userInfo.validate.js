import { body } from "express-validator";

export const validateUpdateBasicUserInfo = [
  body("name")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2 })
    .withMessage("Tên phải có ít nhất 2 ký tự"),

  body("dayOfBirth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Ngày sinh không hợp lệ")
    .custom((value) => {
        const dob = new Date(value);
        const year = dob.getFullYear();
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 75; // tối đa 75 tuổi
        const maxYear = currentYear - 14;  // tối thiểu 14 tuổi
        if (year < minYear || year > maxYear) {
        throw new Error(`Năm sinh phải từ ${minYear} đến ${maxYear}`);
        }
        return true;
    }),

  body("email")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("gender")
    .optional({ nullable: true })
    .isIn(["male", "female", "other"])
    .withMessage("Giới tính không hợp lệ"),
];