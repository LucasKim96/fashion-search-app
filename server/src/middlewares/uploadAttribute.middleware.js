import multer from "multer";

export const uploadAttributeImages = () => {
  const storage = multer.memoryStorage();
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Chỉ cho phép ảnh"), false);
      }
      cb(null, true);
    },
  }).any(); // nhận tất cả file từ form data
};
