import multer from "multer";
import fs from "fs";
import path from "path";

// ⚙️ Tạo storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params; // shopId
    const folderPath = path.join("uploads", "shops", id);

    // tạo thư mục nếu chưa có
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    // đặt tên file: logo_20251010_123456.jpg
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${baseName}_${timestamp}${ext}`);
  },
});

// 🧤 Bộ lọc chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file ảnh"), false);
  }
};

// Giới hạn dung lượng 5MB
const limits = { fileSize: 5 * 1024 * 1024 };

export const upload = multer({ storage, fileFilter, limits });
