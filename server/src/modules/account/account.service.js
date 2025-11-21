import Account from "./account.model.js";
import Role from "./role.model.js";
import { getLastActiveString } from "../../utils/index.js";

const formatAccount = (account) => ({
	...account.toObject(),
	lastActiveVN: getLastActiveString(account),
});

/**
 * Lấy danh sách tất cả role
 */
export const getAllRoles = async () => {
	try {
		const roles = await Role.find().sort({ level: -1 }); // ưu tiên role level cao trước
		return {
			success: true,
			message: "Lấy danh sách vai trò thành công!",
			data: roles,
		};
	} catch (error) {
		return {
			success: false,
			message: error.message || "Lỗi khi lấy danh sách vai trò",
		};
	}
};

export const getAllAccounts = async () => {
	try {
		const accounts = await Account.find()
			.populate("roles")
			.populate("userInfoId");

		return {
			success: true,
			message: "Lấy danh sách tài khoản thành công!",
			data: accounts.map(formatAccount),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const getAccountById = async (id) => {
	try {
		const account = await Account.findById(id)
			.populate("roles")
			.populate("userInfoId");

		if (!account) throw new Error("Không tìm thấy tài khoản!");

		return {
			success: true,
			message: "Lấy thông tin tài khoản thành công!",
			data: formatAccount(account),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const getAccountsByStatus = async (status) => {
	try {
		const validStatuses = ["active", "inactive"];
		if (!validStatuses.includes(status))
			throw new Error("Trạng thái không hợp lệ!");

		const accounts = await Account.find({ status })
			.populate("roles")
			.populate("userInfoId");

		return {
			success: true,
			message: `Lấy danh sách tài khoản có trạng thái '${status}' thành công!`,
			data: accounts,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const getAccountsByRole = async (roleId) => {
	try {
		const role = await Role.findById(roleId);
		if (!role) throw new Error("Không tìm thấy vai trò!");

		const accounts = await Account.find({ roles: roleId })
			.populate("roles")
			.populate("userInfoId");

		return {
			success: true,
			message: `Lấy danh sách tài khoản có vai trò '${role.roleName}' thành công!`,
			data: accounts.map(formatAccount),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

/** Lấy danh sách tài khoản bị chặn */
export const getBannedAccounts = async () => {
	try {
		const accounts = await Account.find({ isBanned: true })
			.populate("roles")
			.populate("userInfoId");

		return {
			success: true,
			message: "Lấy danh sách tài khoản bị chặn thành công!",
			data: accounts.map(formatAccount),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

/** Lấy danh sách tài khoản không bị chặn */
export const getUnbannedAccounts = async () => {
	try {
		const accounts = await Account.find({ isBanned: false })
			.populate("roles")
			.populate("userInfoId");

		return {
			success: true,
			message: "Lấy danh sách tài khoản không bị chặn thành công!",
			data: accounts.map(formatAccount),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

// NẾU BỊ CHẶN CẦN KHIẾN TÀI KHOẢN LOGOUT
// Chặn hoặc mở chặn tài khoản
export const toggleBanAccount = async (id) => {
	try {
		const account = await Account.findById(id);
		if (!account) throw new Error("Không tìm thấy tài khoản!");

		account.isBanned = !account.isBanned;
		// Khi bị chặn, đồng thời đổi status về inactive
		// if (account.isBanned) account.status = "inactive";
		await account.save();

		return {
			success: true,
			message: account.isBanned
				? "Đã khóa tài khoản thành công!"
				: "Đã mở khóa tài khoản thành công!",
			data: formatAccount(account),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

//Cập nhật thông tin cơ bản (username, phoneNumber)
export const updateBasicInfo = async (id, data) => {
	try {
		const { username, phoneNumber } = data;

		// Kiểm tra ID hợp lệ trước khi truy vấn
		if (!id || id.length !== 24) throw new Error("ID tài khoản không hợp lệ!");

		const account = await Account.findById(id);
		if (!account) throw new Error("Không tìm thấy tài khoản!");

		let hasChange = false;

		// === Cập nhật username nếu có truyền vào và khác giá trị cũ ===
		if (username && username !== account.username) {
			const existingUsername = await Account.findOne({
				username,
				_id: { $ne: id },
			});
			if (existingUsername) throw new Error("Username đã tồn tại!");
			account.username = username;
			hasChange = true;
		}

		// === Cập nhật phoneNumber nếu có truyền vào và khác giá trị cũ ===
		if (phoneNumber && phoneNumber !== account.phoneNumber) {
			const existingPhone = await Account.findOne({
				phoneNumber,
				_id: { $ne: id },
			});
			if (existingPhone) throw new Error("Số điện thoại đã tồn tại!");
			account.phoneNumber = phoneNumber;
			hasChange = true;
		}

		// Nếu có thay đổi thì mới lưu
		if (hasChange) {
			await account.save();
		}

		return {
			success: true,
			message: hasChange
				? "Cập nhật thông tin tài khoản thành công!"
				: "Không có thay đổi nào được thực hiện!",
			data: formatAccount ? formatAccount(account) : account,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const updateRoles = async (id, roleIds) => {
	try {
		const account = await Account.findById(id);
		if (!account) throw new Error("Không tìm thấy tài khoản!");

		const validRoles = await Role.find({ _id: { $in: roleIds } });
		if (validRoles.length !== roleIds.length)
			throw new Error("Vai trò không hợp lệ!");

		account.roles = roleIds;
		await account.save();

		return {
			success: true,
			message: "Cập nhật vai trò tài khoản thành công!",
			data: formatAccount(account),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

// action: "add" | "remove"
// Thêm hoặc xóa role linh hoạt
// export const modifyRoles = async (id, roleIds, action) => {
//   try {
//     const account = await Account.findById(id).populate("roles");
//     if (!account) throw new Error("Không tìm thấy tài khoản!");

//     // Lấy danh sách role hợp lệ
//     const validRoles = await Role.find({ _id: { $in: roleIds } });
//     if (validRoles.length !== roleIds.length)
//       throw new Error("Một hoặc nhiều vai trò không hợp lệ!");

//     const currentRoleIds = account.roles.map((r) => r._id.toString());
//     const currentRoleNames = account.roles.map((r) => r.roleName);

//     // Danh sách role hạn chế: chỉ được 1 trong 2 quyền
//     const restrictedRoles = ["Quản trị viên", "Super Admin"];

//     if (action === "add") {
//       let addedCount = 0;
//       for (const role of validRoles) {
//         const roleIdStr = role._id.toString();
//         if (!currentRoleIds.includes(roleIdStr)) {
//           currentRoleIds.push(roleIdStr);
//           addedCount++;
//         }
//       }

//       if (addedCount === 0)
//         throw new Error("Tất cả vai trò được chọn đã tồn tại trong tài khoản!");
//     }

//     else if (action === "remove") {
//       let removedCount = 0;
//       for (const role of validRoles) {
//         const roleIdStr = role._id.toString();

//         // Nếu vai trò không có trong account -> bỏ qua
//         if (!currentRoleIds.includes(roleIdStr)) {
//           continue; // có thể thay bằng throw nếu muốn chặt chẽ hơn
//         }

//         // Nếu chỉ còn 1 vai trò thì không cho xóa
//         if (currentRoleIds.length === 1) {
//           throw new Error("Không thể xóa, tài khoản phải có ít nhất 1 vai trò!");
//         }

//         // Trường hợp đặc biệt: chỉ còn ["Khách hàng", "Chủ shop"]
//         if (
//           currentRoleNames.includes("Khách hàng") &&
//           currentRoleNames.includes("Chủ shop")
//         ) {
//           // Không cho phép xóa "Khách hàng"
//           if (role.roleName === "Khách hàng") {
//             throw new Error(
//               "Không thể xóa vai trò 'Khách hàng' — đây là vai trò mặc định!"
//             );
//           }
//         }

//         // Xóa role hợp lệ
//         currentRoleIds.splice(currentRoleIds.indexOf(roleIdStr), 1);
//         removedCount++;
//       }

//       if (removedCount === 0)
//         throw new Error("Không có vai trò nào trong danh sách cần xóa thuộc tài khoản này!");
//     }

//     else {
//       throw new Error("Hành động không hợp lệ! (chỉ hỗ trợ 'add' hoặc 'remove')");
//     }

//     // Cập nhật roles
//     account.roles = currentRoleIds;
//     await account.save();

//     const updatedAccount = await Account.findById(id).populate("roles");

//     return {
//       success: true,
//       message:
//         action === "add"
//           ? "Đã thêm vai trò cho tài khoản thành công!"
//           : "Đã xóa vai trò cho tài khoản thành công!",
//       data: updatedAccount,
//     };
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// };

export const modifyRoles = async (id, roleIds, action) => {
	try {
		const account = await Account.findById(id).populate("roles");
		if (!account) throw new Error("Không tìm thấy tài khoản!");

		// Danh sách role hợp lệ từ DB
		let validRoles = [];
		if (action === "replace") {
			if (
				!roleIds.new ||
				!Array.isArray(roleIds.new) ||
				roleIds.new.length === 0
			) {
				throw new Error(
					"Danh sách role mới (roleIds.new) không hợp lệ hoặc trống!"
				);
			}
			validRoles = await Role.find({ _id: { $in: roleIds.new } });
			if (validRoles.length !== roleIds.new.length)
				throw new Error("Một hoặc nhiều vai trò mới không hợp lệ!");
		} else {
			if (!Array.isArray(roleIds) || roleIds.length === 0) {
				throw new Error("Danh sách roleIds không hợp lệ hoặc trống!");
			}
			validRoles = await Role.find({ _id: { $in: roleIds } });
			if (validRoles.length !== roleIds.length)
				throw new Error("Một hoặc nhiều vai trò không hợp lệ!");
		}

		// Current roles
		let currentRoleIds = account.roles.map((r) => r._id.toString());
		let currentRoleNames = account.roles.map((r) => r.roleName);

		// Danh sách role hạn chế: chỉ được 1 trong 2 quyền
		const restrictedRoles = ["Quản trị viên", "Super Admin"];

		if (action === "add") {
			for (const role of validRoles) {
				const roleIdStr = role._id.toString();
				if (currentRoleIds.includes(roleIdStr)) continue;

				if (restrictedRoles.includes(role.roleName)) {
					const hasOtherRestricted = currentRoleNames.some((rn) =>
						restrictedRoles.includes(rn)
					);
					if (hasOtherRestricted) {
						throw new Error(
							`Tài khoản chỉ được phép có một trong các quyền: ${restrictedRoles.join(
								", "
							)}`
						);
					}
				}

				currentRoleIds.push(roleIdStr);
				currentRoleNames.push(role.roleName);
			}
		} else if (action === "remove") {
			let removedCount = 0;
			for (const role of validRoles) {
				const roleIdStr = role._id.toString();
				if (!currentRoleIds.includes(roleIdStr)) continue;

				if (currentRoleIds.length === 1) {
					throw new Error(
						"Không thể xóa, tài khoản phải có ít nhất 1 vai trò!"
					);
				}

				if (
					currentRoleNames.includes("Khách hàng") &&
					currentRoleNames.includes("Chủ shop")
				) {
					if (role.roleName === "Khách hàng") {
						throw new Error(
							"Không thể xóa vai trò 'Khách hàng' — đây là vai trò mặc định!"
						);
					}
				}

				currentRoleIds = currentRoleIds.filter((id) => id !== roleIdStr);
				currentRoleNames = currentRoleNames.filter(
					(name) => name !== role.roleName
				);
				removedCount++;
			}

			if (removedCount === 0) {
				throw new Error(
					"Không có vai trò nào trong danh sách cần xóa thuộc tài khoản này!"
				);
			}
		} else if (action === "replace") {
			// Xóa roleIds.old nếu có
			if (roleIds.old && Array.isArray(roleIds.old)) {
				for (const oldId of roleIds.old) {
					const oldRole = account.roles.find((r) => r._id.toString() === oldId);
					if (!oldRole) continue;

					// Không xóa role "Khách hàng"
					if (oldRole.roleName === "Khách hàng") continue;

					currentRoleIds = currentRoleIds.filter((id) => id !== oldId);
					currentRoleNames = currentRoleNames.filter(
						(name) => name !== oldRole.roleName
					);
				}
			}

			// Thêm roleIds.new
			for (const role of validRoles) {
				const roleIdStr = role._id.toString();
				if (currentRoleIds.includes(roleIdStr)) continue;

				// Kiểm tra hạn chế 1 trong 2 quyền
				if (restrictedRoles.includes(role.roleName)) {
					const hasOtherRestricted = currentRoleNames.some((rn) =>
						restrictedRoles.includes(rn)
					);
					if (hasOtherRestricted) {
						throw new Error(
							`Tài khoản chỉ được phép có một trong các quyền: ${restrictedRoles.join(
								", "
							)}`
						);
					}
				}

				currentRoleIds.push(roleIdStr);
				currentRoleNames.push(role.roleName);
			}
		} else {
			throw new Error(
				"Hành động không hợp lệ! (chỉ hỗ trợ 'add', 'remove' hoặc 'replace')"
			);
		}

		// Cập nhật account
		account.roles = currentRoleIds;
		await account.save();

		const updatedAccount = await Account.findById(id).populate("roles");

		return {
			success: true,
			message:
				action === "add"
					? "Đã thêm vai trò cho tài khoản thành công!"
					: action === "remove"
					? "Đã xóa vai trò cho tài khoản thành công!"
					: "Đã cập nhật vai trò cho tài khoản thành công!",
			data: updatedAccount,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const countByStatus = async () => {
	try {
		const stats = await Account.aggregate([
			{ $group: { _id: "$status", count: { $sum: 1 } } },
		]);

		const result = stats.reduce((acc, cur) => {
			acc[cur._id] = cur.count;
			return acc;
		}, {});

		return {
			success: true,
			message: "Thống kê số lượng tài khoản theo trạng thái thành công!",
			data: result,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const countBannedAccounts = async () => {
	try {
		const stats = await Account.aggregate([
			{ $group: { _id: "$isBanned", count: { $sum: 1 } } },
		]);

		const result = {
			banned: stats.find((s) => s._id === true)?.count || 0,
			unbanned: stats.find((s) => s._id === false)?.count || 0,
		};

		return {
			success: true,
			message:
				"Thống kê số lượng tài khoản bị khóa / không bị khóa thành công!",
			data: result,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const countByRole = async () => {
	try {
		const stats = await Account.aggregate([
			{ $unwind: "$roles" },
			{ $group: { _id: "$roles", count: { $sum: 1 } } },
			{
				$lookup: {
					from: "roles",
					localField: "_id",
					foreignField: "_id",
					as: "roleInfo",
				},
			},
			{ $unwind: "$roleInfo" },
			{
				$project: {
					_id: 0,
					roleName: "$roleInfo.roleName",
					count: 1,
				},
			},
		]);

		return {
			success: true,
			message: "Thống kê số lượng tài khoản theo vai trò thành công!",
			data: stats,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

export const searchAccounts = async (keyword) => {
	try {
		if (!keyword) throw new Error("Vui lòng nhập từ khóa tìm kiếm!");

		const regex = new RegExp(keyword, "i");
		const accounts = await Account.find({
			$or: [{ username: regex }, { phoneNumber: regex }],
		})
			.populate("roles")
			.populate("userInfoId");

		return {
			success: true,
			message: `Tìm thấy ${accounts.length} tài khoản phù hợp!`,
			data: accounts.map(formatAccount),
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};
