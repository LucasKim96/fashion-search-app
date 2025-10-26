import fs from "fs";

/**
 * Xóa các file tạm nếu có lỗi trong quá trình xử lý.
 * @param {string[]} files Danh sách đường dẫn file cần xóa.
 */
export const rollbackFiles = (files = []) => {
  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        // console.log(`Rollback file: ${f}`);
      }
    } catch (err) {
      console.warn(`Không thể xóa file tạm: ${f}`, err.message);
    }
  }
};
