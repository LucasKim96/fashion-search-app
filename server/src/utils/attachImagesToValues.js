import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const attachImagesToValues = (req, tempFiles = []) => {
  const values = req.body.values || [];
  if (!Array.isArray(values)) return values;

  const uploadPath = path.resolve(__dirname, "../uploads/attributes");
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// Hàm tìm file theo tên field
  const findFileByField = (key) => {
    if (!req.files) return null;
    if (Array.isArray(req.files)) return req.files.find((f) => f.fieldname === key);
    return req.files[key]?.[0];
  };

  // Gắn ảnh tương ứng với mỗi value
  values.forEach((v) => {
    if (v.fileKey) {
      const file = findFileByField(v.fileKey);
      if (file) {
        const filename = `${Date.now()}_${Math.round(Math.random() * 1e9)}_${file.originalname.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadPath, filename);
        fs.writeFileSync(filePath, file.buffer);
        tempFiles.push(filePath); // ghi nhớ file để rollback nếu lỗi
        v.image = `/uploads/attributes/${filename}`;
      }
    }
  });

  return values;
};


// export const attachImagesToValues = (req) => {
//   const values = req.body.values || [];
//   if (!Array.isArray(values)) return values;

//   const uploadPath = path.resolve(__dirname, "../uploads/attributes");
//   if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// // Hàm tìm file theo tên field
//   const findFileByField = (key) => {
//     if (!req.files) return null;
//     if (Array.isArray(req.files)) return req.files.find((f) => f.fieldname === key);
//     return req.files[key]?.[0];
//   };

//   // Gắn ảnh tương ứng với mỗi value
//   values.forEach((v) => {
//     if (v.fileKey) {
//       const file = findFileByField(v.fileKey);
//       if (file) {
//         const filename = `${Date.now()}_${Math.round(Math.random() * 1e9)}_${file.originalname.replace(/\s+/g, "_")}`;
//         const filePath = path.join(uploadPath, filename);
//         fs.writeFileSync(filePath, file.buffer);
//         v.image = `/uploads/attributes/${filename}`;
//       }
//     }
//   });

//   return values;
// };
