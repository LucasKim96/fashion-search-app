// Kiểm tra user có vai trò nhất định không
const hasRole = (req, roleNames = []) => {
  if (!req.user || !req.user.roles)
    return false;
  return req.user.roles.some(role => roleNames.includes(role));
};

// Chỉ cho phép người có role nhất định
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!hasRole(req, roles)) {
      return res.status(403).json({
        success: false,
        message: `Truy cập bị từ chối! Cần vai trò: ${roles.join(", ")}.`,
      });
    }
    next();
  };
};

// Các middleware nhanh gọn
export const isCustomer = allowRoles("Khách hàng");
export const isShopOwner = allowRoles("Chủ shop");
export const isAdmin = allowRoles("Quản trị viên");
export const isSuperAdmin = allowRoles("Super Admin");

// Kết hợp quyền
export const isShopOrAdmin = allowRoles("Chủ shop", "Quản trị viên", "Super Admin");
export const isCustomerOrShop = allowRoles("Khách hàng", "Chủ shop");
