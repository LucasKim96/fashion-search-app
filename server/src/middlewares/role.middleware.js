// Kiểm tra user có vai trò nhất định không
const hasRole = (req, roleNames = []) => {
	if (!req.user || !req.user.roleNames) return false;
	return req.user.roleNames.some((role) => roleNames.includes(role));
};

// Middleware cho phép người có role nhất định
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

// Middleware kiểm tra chính bản thân or roles
export const checkSelfOrRoles = (...allowedRoles) => {
	return (req, res, next) => {
		try {
			const userId = req.user?.id?.toString();
			const userInfoId = req.user?.userInfoId?.toString();

			// Nếu route có params.id → ưu tiên tuyệt đối
			let targetId = null;

			if (req.params?.id) {
				targetId = req.params.id.toString();
			} else if (req.query?.id) {
				targetId = req.query.id.toString();
			} else if (req.body?.id) {
				targetId = req.body.id.toString();
			}

			if (!targetId) {
				return res.status(400).json({
					success: false,
					message: "Không xác định được người dùng!",
				});
			}

			// SELF CHECK
			const isSelf = userId === targetId || userInfoId === targetId;
			if (isSelf) return next();

			// ROLE CHECK
			const userRoles = req.user?.roleNames || [];
			const isAllowedRole = userRoles.some((r) => allowedRoles.includes(r));

			if (isAllowedRole) return next();

			return res.status(403).json({
				success: false,
				message: "Bạn không có quyền truy cập tài nguyên này!",
			});
		} catch (err) {
			return res.status(500).json({
				success: false,
				message: "Lỗi kiểm tra quyền người dùng!",
			});
		}
	};
};

// Middleware kiểm tra chính chủ
export const isSelf = (req, res, next) => {
	try {
		const userId = req.user?.id?.toString();
		const userInfoId = req.user?.userInfoId?.toString();

		let targetId = null;

		// Ưu tiên theo thứ tự: params → query → body
		if (req.params?.id) targetId = req.params.id.toString();
		else if (req.query?.id) targetId = req.query.id.toString();
		else if (req.body?.id) targetId = req.body.id.toString();

		if (!targetId) {
			return res.status(400).json({
				success: false,
				message: "Không xác định được người dùng!",
			});
		}

		const isSelf = userId === targetId || userInfoId === targetId;

		if (!isSelf) {
			return res.status(403).json({
				success: false,
				message: "Bạn không có quyền truy cập tài nguyên này!",
			});
		}

		return next();
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "Lỗi kiểm tra quyền người dùng!",
		});
	}
};

export const isSelfOrAdmin = checkSelfOrRoles("Quản trị viên", "Super Admin");
export const isSelfOrShop = checkSelfOrRoles("Chủ shop", "Super Admin");

// Các middleware nhanh gọn
export const isCustomer = allowRoles("Khách hàng");
export const isShopOwner = allowRoles("Chủ shop");
export const isAdmin = allowRoles("Quản trị viên");
export const isSuperAdmin = allowRoles("Super Admin");

// Kết hợp quyền
export const isAdminOrSuperAdmin = allowRoles("Quản trị viên", "Super Admin");
export const isShopOrAdmin = allowRoles(
	"Chủ shop",
	"Quản trị viên",
	"Super Admin"
);
export const isCustomerOrShop = allowRoles("Khách hàng", "Chủ shop");

// // Middleware: chỉ cho phép chủ shop (hoặc super admin) thao tác trong phạm vi của mình
// export const isSelfAndShopOwner = (req, res, next) => {
//   try {
//     const user = req.user;
//     if (!user)
//       return res.status(401).json({
//         success: false,
//         message: "Token không hợp lệ hoặc đã hết hạn!",
//       });

//     const userIdFromToken = user.id?.toString();            // ID tài khoản (Account)
//     const userInfoIdFromToken = user.userInfoId?.toString(); // ID thông tin người dùng (NguoiDung)

//     // Xác định có vai trò hợp lệ
//     const isShopOwner =
//       user.roleNames?.includes("Chủ shop") ||
//       user.roleNames?.includes("Super Admin");

//     if (!isShopOwner) {
//       return res.status(403).json({
//         success: false,
//         message: "Chỉ chủ shop hoặc Super Admin mới được phép truy cập!",
//       });
//     }

//     // Nếu route có id (vd: /users/:id) thì kiểm tra thêm chính chủ
//     const idFromRequest =
//       req.params.id?.toString() ||
//       req.body.id?.toString() ||
//       req.query.id?.toString();

//     if (idFromRequest) {
//       const isSelf =
//         userIdFromToken === idFromRequest ||
//         userInfoIdFromToken === idFromRequest;

//       if (!isSelf && !user.roleNames.includes("Super Admin")) {
//         return res.status(403).json({
//           success: false,
//           message: "Bạn không thể truy cập tài nguyên của người khác!",
//         });
//       }
//     }

//     // Nếu không có id trong request → coi như shop đang thao tác trong phạm vi của mình
//     return next();
//   } catch (err) {
//     console.error("Lỗi kiểm tra quyền chủ shop:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Lỗi kiểm tra quyền chủ shop!",
//     });
//   }
// };
