// server/src/middlewares/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params; // shopId
    const uploadPath = path.join("uploads", "shops", id);

    // Tạo folder nếu chưa có
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name =
      file.fieldname === "avatar" ? "avatar" : "cover" + "_" + Date.now() + ext;
    cb(null, name);
  },
});

export const upload = multer({ storage });
