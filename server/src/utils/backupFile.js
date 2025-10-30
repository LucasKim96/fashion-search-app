import fs from "fs";
import path from "path";

/**
 * Tạo bản backup cho file cũ trước khi xóa.
 * @param {string} filePath Đường dẫn file cần backup
 * @returns {string|null} Đường dẫn file backup (.bak) hoặc null nếu không có
 */
export const backupFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const backupPath = `${filePath}.bak`;
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (err) {
    console.warn(`Không thể backup file: ${filePath}`, err.message);
    return null;
  }
};

/**
 * Khôi phục file từ bản backup nếu có lỗi.
 * @param {string} backupPath Đường dẫn file .bak
 * @param {string} originalPath Đường dẫn file gốc cần khôi phục
 */
export const restoreFile = (backupPath, originalPath) => {
  try {
    if (backupPath && fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, originalPath);
      fs.unlinkSync(backupPath);
      // console.log(`Đã khôi phục file: ${originalPath}`);
    }
  } catch (err) {
    console.warn(`Không thể khôi phục file: ${originalPath}`, err.message);
  }
};

/**
 * Xóa file backup nếu update thành công
 * @param {string} backupPath 
 */
export const removeBackup = (backupPath) => {
  try {
    if (backupPath && fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  } catch (err) {
    console.warn(`Không thể xóa file backup: ${backupPath}`, err.message);
  }
};
