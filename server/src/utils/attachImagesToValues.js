// server/src/utils/attachImagesToValues.js
import path from "path";

/**
 * Gắn đường dẫn ảnh tương ứng với mỗi value dựa trên fileKey.
 *
 * @param {Object} req - Request chứa req.files và req.body.values
 * @param {string[]} tempFiles - Mảng chứa đường dẫn file tạm để rollback nếu lỗi
 * @param {Object} options - Cấu hình linh hoạt cho từng loại upload
 * @param {string} options.baseFolder - 
 *   Đường dẫn **thật (tuyệt đối)** trên server nơi file được lưu trữ.
 *   Ví dụ: `path.join(process.cwd(), "uploads", "attributes")`
 *   Thực tế: `/var/www/project/uploads/attributes`
 *   (chỉ dùng cho server, không dùng để hiển thị trên web)
 *
 * @param {string} options.publicPath -
 *   Đường dẫn **công khai (public)** để truy cập file từ client.
 *   Ví dụ: `/uploads/attributes`
 *   Khi kết hợp với domain: `https://your-domain.com/uploads/attributes/...`
 *   (đây là đường dẫn được lưu vào database để hiển thị ảnh cho frontend)
 * @returns {Array} Mảng values đã được gắn image nếu có
 */
export const attachImagesToValues = (req, tempFiles = [], options = {}) => {
  const { baseFolder, publicPath } = options;

  if (!baseFolder || !publicPath) {
    throw new Error("Thiếu cấu hình baseFolder hoặc publicPath trong attachImagesToValues");
  }

  let values = req.body.values || [];
  if (typeof values === "string") {
    try {
      values = JSON.parse(values);
    } catch {
      throw new Error("Giá trị 'values' không phải JSON hợp lệ");
    }
  }

  if (!Array.isArray(values)) return [];

  const validKeys = values.map(v => v.fileKey).filter(Boolean);
  // loại bỏ file thừa khỏi quy trình xử lý và rollback nếu có nhiều file tải xuống do boundary, hoặc browser đôi khi tự attach lại file nhiều lần 
  const files = (Array.isArray(req.files) ? req.files : []).filter(f => validKeys.includes(f.fieldname));


  values.forEach((value) => {
    if (value.fileKey) {
      const matched = files.find((f) => f.fieldname === value.fileKey);
      if (matched) {
        // Gắn đường dẫn public để lưu trong DB
        value.image = `${publicPath}/${matched.filename}`;

        // Lưu đường dẫn tuyệt đối để rollback khi cần
        tempFiles.push(path.join(baseFolder, matched.filename));
      }
    }
  });

  return values;
};
