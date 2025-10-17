import Account from "./account.model.js";
import Role from "./role.model.js";
import { getLastActiveString } from "../../utils/index.js";

const formatAccount = (account) => ({
  ...account.toObject(),
  lastActiveVN: getLastActiveString(account),
});

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
    if (!id || id.length !== 24)
      throw new Error("ID tài khoản không hợp lệ!");

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
      message: "Thống kê số lượng tài khoản bị khóa / không bị khóa thành công!",
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
