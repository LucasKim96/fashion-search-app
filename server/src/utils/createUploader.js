import multer from "multer";
import fs from "fs";
import path from "path";

// --- CÁC CẤU HÌNH MẶC ĐỊNH ---

// 🧤 Bộ lọc ảnh mặc định (giống code của bạn)
const defaultFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file ảnh"), false);
  }
};

// 🏋️ Giới hạn dung lượng 5MB mặc định (giống code của bạn)
const defaultLimits = { fileSize: 5 * 1024 * 1024 };

// --- HÀM KHỞI TẠO UPLOADER ---

/**
 * Tạo một middleware Multer có thể tùy chỉnh
 * @param {object} options
 * @param {(req: Request) => string} options.destinationGenerator - Hàm trả về đường dẫn thư mục đích.
 * @param {function} [options.customFileFilter] - (Tùy chọn) Bộ lọc file tùy chỉnh.
 * @param {object} [options.customLimits] - (Tùy chọn) Giới hạn file tùy chỉnh.
 */
export const createUploader = ({
  destinationGenerator,
  customFileFilter,
  customLimits,
}) => {
  // ⚙️ Tạo storage config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // ❗️ Điểm mấu chốt: Dùng hàm được truyền vào để lấy đường dẫn
      const folderPath = destinationGenerator(req);

      // tạo thư mục nếu chưa có
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      // Logic đặt tên file này khá tốt và có thể dùng chung
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const timestamp = Date.now();
      cb(null, `${baseName}_${timestamp}${ext}`);
    },
  });

  // Sử dụng bộ lọc/giới hạn tùy chỉnh nếu có, nếu không thì dùng mặc định
  const fileFilter = customFileFilter || defaultFileFilter;
  const limits = customLimits || defaultLimits;

  return multer({ storage, fileFilter, limits });
};
