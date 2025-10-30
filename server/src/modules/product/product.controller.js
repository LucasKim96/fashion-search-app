import * as ProductService from "./product.service.js";
import { attachImagesByFileKey, rollbackFiles, handleValidation } from "../../utils/index.js";
import path from "path";

// --- Cấu hình thư mục upload ---
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
export const PRODUCTS_PUBLIC = "/uploads/products";

export const getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductService.getProductDetail(productId);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Hàm dùng chung để lấy danh sách sản phẩm theo bối cảnh khác nhau.
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Object} options
 * @param {Boolean} [options.forAdmin=false] - true => admin xem toàn bộ, kể cả ẩn
 * @param {Boolean} [options.forShop=false] - true => shop xem sản phẩm của mình
 * @param {Boolean} [options.forCustomer=false] - true => khách hàng xem (ẩn filter)
 */
export const handleGetAllProductsBase = async (req, res, options = {}) => {
  try {
    const {
      forAdmin = false,
      forShop = false,
      forCustomer = false,
    } = options;

    // Mặc định không lấy sản phẩm ẩn
    let includeInactive = false;
    let shopId = null;
    let accountId = null;

    // --- Trường hợp admin ---
    if (forAdmin) {
      includeInactive = true; // admin xem tất cả
    }

    // --- Trường hợp shop ---
    else if (forShop) {
      accountId = req.user?.id;
      if (!accountId) {
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc thiếu thông tin shop.",
        });
      }
      includeInactive = true; // shop được xem cả sản phẩm ẩn của mình
    }

    // --- Trường hợp khách hàng xem toàn bộ hoặc của 1 shop ---
    else if (forCustomer) {
      shopId = req.query.shopId || null;
      includeInactive = false; // khách hàng chỉ xem sản phẩm đang hiển thị
    }

    // --- Gọi service ---
    const result = await ProductService.getAllProducts({
      shopId,
      accountId,
      includeInactive,
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

// Controller: Tạo sản phẩm mới kèm biến thể và ảnh
export const createProductWithVariants = async (req, res) => {
  const tempFiles = [];
  try {
    // --- Validate ---
    const validationError = handleValidation(req);
    if (validationError) return res.status(400).json(validationError);

    // --- Lấy dữ liệu chính ---
    const accountId = req.user?.id?.toString();
    if (!accountId)
      return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc hết hạn" });

    const { pdName, basePrice, description = ""} = req.body;
    if (!pdName || !basePrice)
      return res.status(400).json({ success: false, message: "Thiếu tên hoặc giá sản phẩm" });

    // --- Xử lý ảnh sản phẩm (upload nhiều ảnh) ---
    // Ở đây frontend gửi dưới dạng form-data:
    // - images[]: nhiều file upload
    // - variantsPayload: text (JSON) + fileKey tương tự attribute
    let productImages = [];
    if (req.files) {
      // Nếu frontend upload ảnh sản phẩm với field name = "images"
      const imgFiles = req.files.filter(f => f.fieldname === "images");
      for (const f of imgFiles) {
        productImages.push(`${PRODUCTS_PUBLIC}/${f.filename}`);
        tempFiles.push(path.join(PRODUCT_FOLDER, f.filename));
      }
    }

    // --- Xử lý biến thể (variantsPayload) ---
    let variantsPayload = req.body.variantsPayload || [];
    if (typeof variantsPayload === "string") {
      try {
        variantsPayload = JSON.parse(variantsPayload);
      } catch {
        return res.status(400).json({ success: false, message: "variantsPayload không phải JSON hợp lệ" });
      }
    }

    // Gắn ảnh variant dựa vào fileKey
    const variantsWithImages = attachImagesByFileKey(req, "variantsPayload", tempFiles, {
      baseFolder: PRODUCT_FOLDER,
      publicPath: PRODUCTS_PUBLIC,
    });

    // --- Gọi service ---
    const payload = {
      pdName,
      basePrice: parseFloat(basePrice),
      description,
      images: productImages,
      accountId,
      variantsPayload: variantsWithImages,
    };

    const result = await ProductService.createProductWithVariantsService(payload, tempFiles);
    if (!result.success) rollbackFiles(tempFiles);

    return res.status(result.success ? 201 : 400).json(result);

  } catch (error) {
    console.error("handleCreateProductWithVariants error:", error);
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cập nhật danh sách ảnh sản phẩm (thay mới hoặc thêm ảnh)
 * FormData gồm:
 *   - images[]: danh sách file upload (tối đa 50)
 *   - keepImages: JSON string (danh sách ảnh cũ muốn giữ lại)
 *   - mode: add thêm mới | keep giữ 1 phần |  replace thay thế toàn bộ ảnh cũ (không cần keepImages)
 */
export const updateProductImages = async (req, res) => {
  const tempFiles = [];

  try {
    const productId = req.params.productId;
    if (!productId)
      return res.status(400).json({ success: false, message: "Thiếu productId" });

    // --- Lấy mode ---
    const mode = req.body.mode || "add"; // mặc định "add"

    // --- Lấy danh sách ảnh muốn giữ lại ---
    let keepImages = [];
    if (req.body.keepImages) {
      try {
        keepImages = JSON.parse(req.body.keepImages);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "keepImages không phải JSON hợp lệ" });
      }
    }

    // --- Lấy danh sách ảnh upload mới ---
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = req.files.map((f) => {
        tempFiles.push(path.join(PRODUCT_FOLDER, f.filename)); // rollback nếu lỗi
        return `${PRODUCTS_PUBLIC}/${f.filename}`;
      });
    }

    // --- Tổng hợp danh sách ảnh mới ---
    let newImages = [];

    switch (mode) {
      case "keep":
        // chỉ giữ lại ảnh được chọn, không thêm mới
        newImages = [...keepImages];
        break;
      case "add":
        newImages = await ProductService.handleAddModeImages(productId, keepImages, uploadedImages);
        break;
      case "replace":
        // thay toàn bộ ảnh bằng ảnh mới upload
        newImages = [...uploadedImages];
        break;
      default:
        return res.status(400).json({ success: false, message: "Mode không hợp lệ" });
    }

    // --- Gọi service cập nhật ---
    const result = await ProductService.updateProductImagesService(productId, newImages);

    if (!result.success) rollbackFiles(tempFiles);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProductBasicInfo = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductService.updateProductBasicInfoService(productId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleProductActiveAuto = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductService.toggleProductActiveAutoService(productId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProductWithVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await ProductService.deleteProductWithVariantsService(productId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller thống kê số lượng sản phẩm
 * - Khách hàng → truyền shopId trong query
 * - Shop → lấy accountId từ token
 * - Admin → không truyền gì (đếm toàn bộ)
 * 
 * Query params:
 *   - shopId (tùy chọn)
 *   - includeInactive (true/false)
 */
export const handleCountProducts = async (req, res, { isAdmin = false } = {}) => {
  try {
    const { shopId, includeInactive } = req.query;

    // Xác định accountId (nếu không phải admin)
    const accountId = !isAdmin ? req.user?.id : null;

    // Gọi service thống kê
    const result = await ProductService.countProductsService({
      shopId,
      accountId,
      includeInactive: includeInactive === "true", // ép kiểu boolean
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, total: 0 });
  }
};

//Khách hàng xem toàn bộ sản phẩm đang hiển thị
export const getAllPublicProducts = (req, res) => {
  return handleGetAllProductsBase(req, res, { forCustomer: true });
};
//Khách hàng xem sản phẩm đang hiển thị của 1 shop
export const getShopPublicProducts = (req, res) => {
  // shopId truyền qua query ?shopId=...
  return handleGetAllProductsBase(req, res, { forCustomer: true });
};

// Shop xem tất cả sản phẩm của mình (kể cả ẩn)
export const getShopProducts = (req, res) => {
  return handleGetAllProductsBase(req, res, { forShop: true });
};

// Admin xem toàn bộ sản phẩm hệ thống
export const getAllProductsAdmin = (req, res) => {
  return handleGetAllProductsBase(req, res, { forAdmin: true });
};


/**
 * Khách hàng xem số lượng sản phẩm của 1 shop
 * - Gọi với query ?shopId=xxx
 * - Không cần đăng nhập
 */
export const countProductsByShop = (req, res) => {
  return handleCountProducts(req, res, { isAdmin: false });
};

//Shop xem số lượng sản phẩm của chính mình
export const countMyProducts = (req, res) => {
  return handleCountProducts(req, res, { isAdmin: false });
};
//Admin xem tổng số sản phẩm toàn hệ thống
export const countAllProducts = (req, res) => {
  return handleCountProducts(req, res, { isAdmin: true });
};