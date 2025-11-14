"use client";
import React, { useEffect, useState, useRef } from "react";
import { Account } from "@shared/features/account/account.types";
import { useAuth } from "@shared/features/auth";
import { useAccount } from "@shared/features/account";
import { Role } from "@shared/features/role/role.types";
import { RoleKey, mapBackendRoles } from "@shared/core";
import { buildImageUrl } from "@shared/core";
import { formatVNDate } from "@shared/core/utils/dateTime";
import {
    CheckCircle,
    Ban,
    CircleHelp,
    UserCheck,
    Mail,
    User,
    Calendar,
    Clock,
    Activity,
    Zap,
    Phone,
    ShieldCheck,
    Save,
    X,
    XCircle
} from "lucide-react";
import clsx from "clsx";

interface AccountDetailModalProps {
    account: Account;
    onClose: () => void;
    refreshAccounts: (keyword?: string) => void;
    countByRole: () => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({ account, onClose, refreshAccounts, countByRole }) => {
    const { user } = useAuth();
    const { fetchAllRoles, allRolesState, modifyRoles, modifyRolesState} = useAccount();
    const [isEditingRoles, setIsEditingRoles] = useState(false);
    
    const [selectedRoles, setSelectedRoles] = useState<string[]>(() =>
        account.roles?.map((r) => r._id) || []
    );

    // Lưu role ban đầu để có thể khôi phục khi nhấn "Hủy"
    const originalRolesRef = useRef<string[]>([]);
    useEffect(() => {
    originalRolesRef.current = selectedRoles;
    }, [selectedRoles]);

    const userInfo = typeof account.userInfoId === "object" ? account.userInfoId : null;

    const statusIcon = account.isBanned
        ? <Ban className="text-red-500" size={18} />
        : !account.isBanned && account.status === "active"
        ? <CheckCircle className="text-green-500" size={18} />
        : <CircleHelp className="text-gray-400" size={18} />;

    const statusBadge = account.isBanned
        ? "Bị khóa"
        : !account.isBanned && account.status === "active"
        ? "Đang hoạt động"
        : "Ngưng hoạt động";

    // ===== Lấy danh sách roles =====
    useEffect(() => {
        fetchAllRoles();
    }, []);

    useEffect(() => {
        setSelectedRoles(account.roles?.map(r => r._id) || []);
    }, []);
    // ===== Xử lý quyền truy cập =====
    const currentUserRoles = mapBackendRoles(user?.roles || []);
    const isSuperAdmin = currentUserRoles.includes("SUPER_ADMIN" as RoleKey);

    const canModifyTarget = account.roles.some((r) => r.level > 2);

    // ===== Xử lý thay đổi role =====
    const handleRoleToggle = (roleId: string) => {
        setSelectedRoles((prev) =>
            prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSaveRoles = async () => {
        const oldRoleIds = account.roles.map(r => r._id);
        const added = selectedRoles.filter(id => !oldRoleIds.includes(id));
        const removed = oldRoleIds.filter(id => !selectedRoles.includes(id));

        try {
            if (added.length > 0 && removed.length > 0) {
                // Dùng replace nếu vừa xóa vừa thêm
                await modifyRoles(account._id, {
                    action: "replace",
                    roleIds: { old: removed, new: added },
                });
            } else if (added.length > 0) {
                await modifyRoles(account._id, { action: "add", roleIds: added });
            } else if (removed.length > 0) {
                await modifyRoles(account._id, { action: "remove", roleIds: removed });
            }

            // Reload lại danh sách tài khoản
            await refreshAccounts("");
            // Reload thống kê vai trò
            countByRole?.();
        } catch (error) {
            console.error("Lỗi khi lưu roles:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-10 relative border border-gray-200 transform translate-y-6 transition-all duration-300">
                {/* Header */}
                <div className="flex items-center gap-5 mb-5">
                    <img
                        src={userInfo ? buildImageUrl(userInfo.avatar) : "/default-avatar.png"}
                        alt="avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-md"
                    />
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">{userInfo?.name || account.username}</h2>
                        {account.username && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <User size={16} /> {account.username}
                            </p>
                        )}
                        {account.phoneNumber && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone size={16} /> {account.phoneNumber}
                            </p>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    {/* Trạng thái */}
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold flex items-center gap-1 text-indigo-600">
                            <Zap size={16} /> Trạng thái
                        </span>
                        <div className="flex items-center gap-2">
                            {statusIcon}
                            <span
                                className={clsx(
                                    "px-2 py-0.5 rounded text-sm font-medium shadow-sm",
                                    account.isBanned
                                        ? "bg-red-100 text-red-700"
                                        : !account.isBanned && account.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                )}
                            >
                                {statusBadge}
                            </span>
                        </div>
                    </div>

                    {/* Vai trò */}
                    {account.roles.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <UserCheck size={16} /> Vai trò
                            </span>
                            <span>{account.roles.map((r) => r.roleName).join(", ")}</span>
                        </div>
                    )}

                    {/* Email */}
                    {userInfo?.email && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <Mail size={16} /> Email
                            </span>
                            <span>{userInfo.email}</span>
                        </div>
                    )}

                    {/* Giới tính */}
                    {userInfo?.gender && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <User size={16} /> Giới tính
                            </span>
                            <span>{userInfo.gender}</span>
                        </div>
                    )}

                    {/* Ngày sinh */}
                    {userInfo?.dayOfBirth && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <Calendar size={16} /> Ngày sinh
                            </span>
                            <span>{formatVNDate(userInfo.dayOfBirth)}</span>
                        </div>
                    )}

                    {/* Ngày tạo */}
                    {account.createdAt && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <Clock size={16} /> Ngày tạo
                            </span>
                            <span>{formatVNDate(account.createdAt)}</span>
                        </div>
                    )}

                    {/* Cập nhật lần cuối */}
                    {account.updatedAt && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <Clock size={16} /> Cập nhật lần cuối
                            </span>
                            <span>{formatVNDate(account.updatedAt)}</span>
                        </div>
                    )}

                    {/* Đăng nhập cuối */}
                    {account.lastActiveVN && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold flex items-center gap-1 text-indigo-600">
                                <Activity size={16} /> Đăng nhập cuối
                            </span>
                            <span>{account.lastActiveVN}</span>
                        </div>
                    )}
                </div>

                
                {/* ===== Footer & Quản lý quyền ===== */}
                <div className="mt-4 border-t pt-1">
                {!isEditingRoles ? (
                    <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl shadow-sm font-medium flex items-center gap-2 transition"
                        onClick={onClose}
                    >
                        <X size={16} />
                        Đóng
                    </button>

                    {isSuperAdmin && canModifyTarget && (
                        <button
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md font-medium flex items-center gap-2 transition"
                        onClick={() => setIsEditingRoles(true)}
                        >
                        <ShieldCheck size={16} />
                        Thay đổi quyền
                        </button>
                    )}
                    </div>
                ) : (
                    <>
                    {/* Form thay đổi quyền */}
                    <div className="mt-4">
                        <h3 className="flex items-center gap-2 font-semibold text-indigo-700">
                        <ShieldCheck size={18} /> Quản lý quyền
                        </h3>

                        {allRolesState.loading ? (
                        <p className="text-sm text-gray-500 mt-2">
                            Đang tải danh sách quyền...
                        </p>
                        ) : (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {allRolesState.data
                            ?.filter(
                                (role: Role) =>
                                role.roleName !== "Chủ shop" && role.roleName !== "Chủ shop"
                            )
                            .map((role: Role) => (
                                <label
                                key={role._id}
                                className={clsx(
                                    "px-3 py-1 rounded-xl border text-sm cursor-pointer select-none transition",
                                    selectedRoles.includes(role._id)
                                    ? "bg-indigo-500 text-white border-indigo-500"
                                    : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                                )}
                                >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedRoles.includes(role._id)}
                                    onChange={() => handleRoleToggle(role._id)}
                                />
                                {role.roleName}
                                </label>
                            ))}
                        </div>
                        )}
                    </div>

                    {/* Nút hành động khi đang chỉnh sửa */}
                    <div className="flex justify-end gap-3 mt-5">
                        <button
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl shadow-sm font-medium flex items-center gap-2 transition"
                        onClick={() => {
                            setIsEditingRoles(false);
                            setSelectedRoles(originalRolesRef.current);
                        }}
                        disabled={modifyRolesState.loading}
                        >
                        <XCircle size={16} />
                        Hủy
                        </button>

                        <button
                        className={clsx(
                            "px-4 py-2 rounded-xl shadow-md font-medium flex items-center gap-2 transition",
                            modifyRolesState.loading
                            ? "bg-green-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        )}
                        onClick={handleSaveRoles}
                        disabled={modifyRolesState.loading}
                        >
                        <Save size={16} />
                        {modifyRolesState.loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                    </>
                )}
                </div>
            </div>
        </div>
    );
};