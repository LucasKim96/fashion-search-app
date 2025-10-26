import * as AttributeService from "./attribute.service.js";
import { handleValidation, attachImagesToValues, rollbackFiles} from "../../utils/index.js";

const handleCreateAttribute = async (req, res, isAdmin = false) => {
  const tempFiles = [];
  try {
    // --- Kiểm tra dữ liệu hợp lệ ---
    const validationError = handleValidation(req);
    if (validationError) return res.status(400).json(validationError);

    // --- Gắn ảnh vào các value (và lưu tạm ảnh ra disk) ---
    req.body.values = attachImagesToValues(req, tempFiles);

    // --- Lấy accountId (null cho admin) ---
    const accountId = isAdmin ? null : req.user?.id;
    if (!isAdmin && !accountId)
      return res.status(401).json({ success: false, message: "Không xác thực được tài khoản shop" });

    // --- Gọi service xử lý DB ---
    const result = await AttributeService.createAttribute(req.body, accountId);

    // --- Nếu service lỗi → rollback ảnh ---
    if (!result.success) {
      rollbackFiles(tempFiles);
      return res.status(400).json(result);
    }

    // --- Nếu thành công: giữ nguyên ảnh ---
    return res.status(201).json(result);
  } catch (error) {
    console.error("handleCreateAttribute error:", error);
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const handleUpdateAttribute = async (req, res, isAdmin = false) => {
  const tempFiles = [];
  try {
    // Validate dữ liệu
    const validationError = handleValidation(req);
    if (validationError) return res.status(400).json(validationError);

    // Lưu tạm ảnh và gắn vào value (có ghi ra ổ cứng)
    req.body.values = attachImagesToValues(req, tempFiles);

    // Lấy id và accountId (nếu là shop)
    const { id } = req.params;
    const accountId = isAdmin ? null : req.user?.id;

    // Gọi service xử lý cập nhật
    const result = await AttributeService.updateAttribute(id, req.body, accountId);

    // Nếu service lỗi → rollback ảnh
    if (!result.success) {
      rollbackFiles(tempFiles);
      return res.status(400).json(result);
    }

    // Thành công → giữ ảnh
    return res.status(200).json(result);
  } catch (error) {
    console.error("handleUpdateAttribute error:", error);
    rollbackFiles(tempFiles);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const handleUpdateAttributeLabel = async (req, res, isShop = false) => {
  try {
    // --- Validate ---
    const validationError = handleValidation(req);
    if (validationError) 
      return res.status(400).json(validationError);

    const { id } = req.params;
    const { label } = req.body;
    let accountId = null;

    // --- Nếu là shop thì cần kiểm tra token ---
    if (isShop) {
      accountId = req.user?.id;
      if (!accountId)
        return res.status(401).json({ success: false, message: "Token không hợp lệ" });
    }

    // --- Gọi service cập nhật ---
    const result = await AttributeService.updateAttributeOnly(id, { label }, accountId);
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleSearchAttributesBase = async (req, res, { isGlobal }) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    const accountId = !isGlobal ? req.user?.id : null; // chỉ truyền khi là shop

    const result = await AttributeService.searchAttributes({
      query,
      isGlobal,
      accountId,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("searchAttributesBase error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ========================= PUBLIC CONTROLLER =========================
export const getAttributesFlexible = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, includeInactive } = req.query;

    // --- Lấy role từ token ---
    const roleNames = req.user?.roleNames || [];

    // --- Xác định quyền admin ---
    const isAdmin =
      req.path.includes("/admin") ||
      roleNames.some((r) => ["Quản trị viên", "Super Admin"].includes(r));

    // --- Nếu không phải admin => shop ---
    const accountId = isAdmin ? null : req.user?.id;

    // --- Xác định có lấy inactive hay không ---
    const includeAll =
      includeInactive === "true" ||
      includeInactive === true ||
      roleNames.includes("Super Admin"); // ví dụ chỉ Super Admin được lấy tất cả

    // --- Gọi service chung ---
    const result = await AttributeService.getAttributesFlexible({
      isAdmin,
      accountId,
      includeInactive: includeAll,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // --- Trả kết quả ---
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("getAttributesFlexible error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttributes = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    // Lấy danh sách roleName từ token
    const roleNames = req.user?.roleNames || [];
    // Xác định có phải admin không
    const isAdmin =
      req.path.includes("/admin") ||
      roleNames.some((name) => ["Quản trị viên", "Super Admin"].includes(name));

    const accountId = isAdmin ? null : req.user?.id;

    const result = await AttributeService.getAttributesUnified({
      isAdmin,
      accountId,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("getAttributes error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// [GET] /attributes/:id
export const getAttributeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AttributeService.getAttributeById(id);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("getAttributeById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] /attributes/:id
export const deleteGlobalAttribute = async (req, res) => {
  try {
    const result = await AttributeService.deleteAttribute(req.params.id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    // console.error("deleteGlobalAttribute error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// [PATCH] /attributes/:id/toggle
export const toggleGlobalAttribute = async (req, res) => {
  try {
    const result = await AttributeService.toggleActiveAttribute(req.params.id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    // console.error("toggleGlobalAttribute error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ========================= ADMIN CONTROLLER =========================
// Tạo thuộc tính + valus cho admin
export const createGlobalAttribute = (req, res) => handleCreateAttribute(req, res, true);
// Cập nhật thuộc tính + valus cho admin
export const updateGlobalAttribute = (req, res) => handleUpdateAttribute(req, res, true);
// Cập nhật label cho admin
export const updateGlobalAttributeLabel = (req, res) => handleUpdateAttributeLabel(req, res, false);
//Tìm kiếm global
export const searchGlobalAttributes = (req, res) => handleSearchAttributesBase(req, res, { isGlobal: true });

// ========================= SHOP CONTROLLER =========================


// Tạo thuộc tính + valus cho shop
export const createShopAttribute = (req, res) => handleCreateAttribute(req, res, false);
// Cập nhật thuộc tính + valus cho shop
export const updateShopAttribute = (req, res) => handleUpdateAttribute(req, res, false);
// Cập nhật label cho shop
export const updateShopAttributeLabel = (req, res) => handleUpdateAttributeLabel(req, res, true);
// Tìm kiếm các thuộc tính của shop
export const searchShopAttributes = (req, res) => handleSearchAttributesBase(req, res, { isGlobal: false });