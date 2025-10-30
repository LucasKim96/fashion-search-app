import * as ProductVariantService from "./productVariant.service.js";
import { rollbackFiles, attachImagesByFileKey, handleValidation,withTransaction } from "../../utils/index.js";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
export const PRODUCTS_PUBLIC = "/uploads/products";

export const generateVariantCombinations = async (req, res) => {
  try {
    const { attributes } = req.body;
    const result = await ProductVariantService.generateVariantCombinations(attributes);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sinh tổ hợp biến thể mới (chưa có trong DB)
 * body: { productId, attributes: [{ attributeId, values: [valueId] }] }
 */
export const generateNewVariantCombinations = async (req, res) => {
  try {
    const { productId, attributes } = req.body;
    const result = await ProductVariantService.generateNewVariantCombinations(productId, attributes);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy danh sách attribute + value (có isUsed) cho 1 sản phẩm
 */
export const getProductAttributesWithValues = async (req, res) => {
  try {
    const productId = req.params.productId;
    const accountId = req.user?.id;
    if (!productId) return res.status(400).json({ success: false, message: "Thiếu productId" });
    if (!accountId) return res.status(401).json({ success: false, message: "Token không hợp lệ" });

    const result = await ProductVariantService.getProductAttributesWithValues(productId, accountId);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Tạo nhiều biến thể cùng lúc (bulk create)
 * FormData gồm:
 *  - variantsPayload: JSON [{ variantKey, attributes, stock, priceAdjustment, imageFileKey }]
 *  - ảnh biến thể: có thể nhiều file (key: imageFileKey tương ứng)
 */
export const createProductVariantsBulk = async (req, res) => {
  const tempFiles = [];
  try {
    const productId = req.params.productId || req.body.productId;
    const accountId = req.user?.id;
    if (!productId) return res.status(400).json({ success: false, message: "Thiếu productId" });
    if (!accountId) return res.status(401).json({ success: false, message: "Token không hợp lệ" });

    // --- Parse JSON variantsPayload ---
    let variantsPayload = req.body.variantsPayload;
    if (typeof variantsPayload === "string") {
      try {
        variantsPayload = JSON.parse(variantsPayload);
      } catch {
        return res.status(400).json({ success: false, message: "variantsPayload không phải JSON hợp lệ" });
      }
    }
    if (!Array.isArray(variantsPayload))
      return res.status(400).json({ success: false, message: "variantsPayload phải là mảng" });

    // --- Gắn ảnh biến thể (nếu có) ---
    // frontend gửi file key trùng với field `imageFileKey` trong variantsPayload
    const variantsWithImages = attachImagesByFileKey(req, "variantsPayload", tempFiles, {
      baseFolder: PRODUCT_FOLDER,
      publicPath: PRODUCTS_PUBLIC,
    });

    // --- Gọi service ---
    let result;
    await withTransaction(async (session) => {
      result = await ProductVariantService.createProductVariantsBulk(
        productId,
        accountId,
        variantsWithImages,
        tempFiles,
        session
      );
      if (!result.success) throw new Error(result.message);
    });

    if (!result.success) rollbackFiles(tempFiles);
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller cập nhật biến thể sản phẩm
 * - rollback ảnh mới upload nếu lỗi
 * - phục hồi ảnh cũ nếu lỗi
 * @param {Object} req
 * @param {Object} res
 * @param {Object} options
 * @param {Boolean} [options.isAdmin=false] - true nếu admin, không cần check shop
 */
export const handleUpdateProductVariant = async (req, res, { isAdmin = false } = {}) => {
  const tempFiles = []; // ảnh mới upload để rollback
  let backupPath = null;
  let oldPath = null;

  try {
    const variantId = req.params.variantId;
    const accountId = !isAdmin ? req.user?.id : null; // shop cần accountId
    const file = req.file; // file mới upload
    const payload = { ...req.body };

    // --- Nếu có file mới thì thêm vào tempFiles để rollback ---
    if (file) {
      tempFiles.push(path.join(PRODUCT_FOLDER, file.filename));
    }

    // --- Gọi service trong transaction ---
    const result = await ProductVariantService.updateProductVariant(variantId, payload, accountId, file);

    // --- Nếu lỗi service thì rollback file mới ---
    if (!result.success) {
      rollbackFiles(tempFiles);
      return res.status(400).json(result);
    }

    // --- Thành công: trả về variant ---
    return res.status(200).json(result);
  } catch (error) {
    // rollback ảnh mới nếu lỗi bất ngờ
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};