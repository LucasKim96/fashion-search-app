import path from "path";

/**
 * Gắn ảnh dựa trên fileKey cho Attribute Value hoặc Product Variant
 *
 * @param {Object} req - request chứa req.files và req.body.[values|variantsPayload]
 * @param {string} bodyKey - key trong req.body, ví dụ "values" hoặc "variantsPayload"
 * @param {Array} tempFiles - mảng lưu đường dẫn tuyệt đối để rollback nếu cần
 * @param {Object} options
 *   - baseFolder: đường dẫn tuyệt đối lưu file trên server
 *   - publicPath: đường dẫn public truy cập từ frontend
 *
 * @returns Array đã gắn `image` nếu fileKey hợp lệ
 */
export const attachImagesByFileKey = (
  req,
  bodyKey,
  tempFiles = [],
  options = {}
) => {
  const { baseFolder, publicPath } = options;
  if (!baseFolder || !publicPath)
    throw new Error(
      "Thiếu baseFolder hoặc publicPath trong attachImagesByFileKey"
    );

  let items = req.body[bodyKey] || [];
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      throw new Error(`${bodyKey} không phải JSON hợp lệ`);
    }
  }
  if (!Array.isArray(items)) return [];

  // --- Lọc file hợp lệ dựa trên fileKey ---
  const validKeys = items.map((v) => v.fileKey).filter(Boolean);
  const files = (Array.isArray(req.files) ? req.files : []).filter((f) =>
    validKeys.includes(f.fieldname)
  );

  items.forEach((item) => {
    if (!item.fileKey) return;
    const matched = files.find((f) => f.fieldname === item.fileKey);
    if (matched) {
      item.image = `${publicPath}/${matched.filename}`;
      tempFiles.push(path.join(baseFolder, matched.filename));
    }
  });

  return items;
};
