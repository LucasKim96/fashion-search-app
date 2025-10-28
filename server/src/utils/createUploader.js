import multer from "multer";
import fs from "fs";
import path from "path";
import process from "process"; // <-- CẦN IMPORT PROCESS

// Lấy thư mục gốc của ứng dụng
const ROOT_DIR = process.cwd(); // <-- ĐỊNH NGHĨA ROOT_DIR

// --- CÁC CẤU HÌNH MẶC ĐỊNH ---

// 🧤 Bộ lọc ảnh mặc định
const defaultFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    // Dùng MulterError là một practice tốt hơn
    const error = new Error("Chỉ cho phép upload file ảnh");
    error.code = "FILE_TYPE_REJECTED";
    cb(error, false);
  }
};

// 🏋️ Giới hạn dung lượng 5MB mặc định
const defaultLimits = { fileSize: 5 * 1024 * 1024 };

// --- HÀM KHỞI TẠO UPLOADER ĐÃ SỬA ---

/**
 * Tạo một middleware Multer có thể tùy chỉnh
 * @param {object} options
 * @param {(req: Request) => string} options.destinationGenerator - Hàm trả về đường dẫn thư mục đích tương đối.
 * @param {boolean} [options.useAssets=false] - Sử dụng thư mục gốc là 'src/assets' thay vì 'uploads'. <-- BỔ SUNG
 * @param {function} [options.customFileFilter] - (Tùy chọn) Bộ lọc file tùy chỉnh.
 * @param {object} [options.customLimits] - (Tùy chọn) Giới hạn file tùy chỉnh.
 */
export const createUploader = ({
  destinationGenerator,
  useAssets = false, // <-- BỔ SUNG VÀO DESTRUCTURING VÀ ĐẶT GIÁ TRỊ MẶC ĐỊNH
  customFileFilter,
  customLimits,
}) => {
  // ⚙️ Tạo storage config
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let baseDir; // 1. XÁC ĐỊNH THƯ MỤC GỐC DỰA TRÊN useAssets
      if (useAssets) {
        // Đường dẫn tuyệt đối đến src/assets
        baseDir = path.join(ROOT_DIR, "assets");
      } else {
        // Đường dẫn tuyệt đối đến uploads
        baseDir = path.join(ROOT_DIR, "uploads");
      } // Lấy đường dẫn tương đối từ generator

      const relativePath = destinationGenerator(req);

      // Ngăn hacker sử dụng ../ để chui ra ngoài folder
      const safePath = path
        .normalize(relativePath)
        .replace(/^(\.\.(\/|\\|$))+/, "");

      const folderPath = path.join(baseDir, safePath);

      // tạo thư mục nếu chưa có
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      // Logic đặt tên file (giữ nguyên)
      const ext = path.extname(file.originalname);
      const timestamp = Date.now();
      const baseName = path.basename(file.originalname, ext);
      cb(null, `${baseName}_${timestamp}${ext}`);
    },
  }); // Sử dụng bộ lọc/giới hạn tùy chỉnh nếu có, nếu không thì dùng mặc định

  const fileFilter = customFileFilter || defaultFileFilter;
  const limits = customLimits || defaultLimits;

  return multer({ storage, fileFilter, limits });
};
