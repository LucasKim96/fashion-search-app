// server/src/modules/account/account.controller.js
import { handleValidation} from "../../utils/index.js";
import * as AccountService from "./account.service.js";

export const getAllRoles = async (req, res) => {
  const result = await AccountService.getAllRoles();
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts
export const getAllAccounts = async (req, res) => {
  const result = await AccountService.getAllAccounts();
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/:id 
export const getAccountById = async (req, res) => {
  const result = await AccountService.getAccountById(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/status/:status
export const getAccountsByStatus = async (req, res) => {
  const result = await AccountService.getAccountsByStatus(req.params.status);
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/role/:roleId 
export const getAccountsByRole = async (req, res) => {
  const result = await AccountService.getAccountsByRole(req.params.roleId);
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/banned 
export const getBannedAccounts = async (req, res) => {
  const result = await AccountService.getBannedAccounts();
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/unbanned 
export const getUnbannedAccounts = async (req, res) => {
  const result = await AccountService.getUnbannedAccounts();
  res.status(result.success ? 200 : 400).json(result);
};

// [PATCH] /api/accounts/:id/toggle-ban
export const toggleBanAccount = async (req, res) => {
  const result = await AccountService.toggleBanAccount(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
};

// [PUT] /api/accounts/:id/basic-info 
export const updateBasicInfo = async (req, res) => {
  const validationError = handleValidation(req);
  if (validationError) return res.status(400).json(validationError);

  const result = await AccountService.updateBasicInfo(req.params.id, req.body);
  return res.status(result.success ? 200 : 400).json(result);
};


// [PUT] /api/accounts/:id/roles 
export const updateRoles = async (req, res) => {
  const { roleIds } = req.body;
  const result = await AccountService.updateRoles(req.params.id, roleIds);
  res.status(result.success ? 200 : 400).json(result);
};

// export const modifyRoles = async (req, res) => {
//   const { roleIds, action } = req.body;

//   // Kiểm tra dữ liệu đầu vào
//   if (!action || !["add", "remove"].includes(action)) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Hành động không hợp lệ! (chỉ hỗ trợ 'add' hoặc 'remove')" });
//   }

//   if (!Array.isArray(roleIds) || roleIds.length === 0) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Danh sách vai trò (roleIds) không hợp lệ hoặc trống!" });
//   }

//   const result = await AccountService.modifyRoles(req.params.id, roleIds, action);
//   res.status(result.success ? 200 : 400).json(result);
// };


// [GET] /api/accounts/stats/status 

export const modifyRoles = async (req, res) => {
  try {
    const { roleIds, action } = req.body;

    if (!action || !["add", "remove", "replace"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Hành động không hợp lệ! (chỉ hỗ trợ 'add', 'remove' hoặc 'replace')",
      });
    }

    if (!roleIds || (typeof roleIds !== "object" && !Array.isArray(roleIds))) {
      return res.status(400).json({
        success: false,
        message: "roleIds không hợp lệ hoặc trống!",
      });
    }

    // Với replace, cần có cả old và new
    if (action === "replace") {
      if (!roleIds.old || !Array.isArray(roleIds.old)) roleIds.old = [];
      if (!roleIds.new || !Array.isArray(roleIds.new) || roleIds.new.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Danh sách vai trò mới (roleIds.new) không hợp lệ hoặc trống!",
        });
      }
    } else {
      // add/remove phải là mảng không rỗng
      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Danh sách roleIds không hợp lệ hoặc trống!",
        });
      }
    }

    const result = await AccountService.modifyRoles(req.params.id, roleIds, action);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const countByStatus = async (req, res) => {
  const result = await AccountService.countByStatus();
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/stats/banned 
export const countBannedAccounts = async (req, res) => {
  const result = await AccountService.countBannedAccounts();
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/stats/role 
export const countByRole = async (req, res) => {
  const result = await AccountService.countByRole();
  res.status(result.success ? 200 : 400).json(result);
};

// [GET] /api/accounts/search 
export const searchAccounts = async (req, res) => {
  const { keyword } = req.query;
  const result = await AccountService.searchAccounts(keyword);
  res.status(result.success ? 200 : 400).json(result);
};
