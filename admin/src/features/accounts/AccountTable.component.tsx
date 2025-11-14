"use client";

import React, { useMemo } from "react";
import { Table, SidebarTooltip } from "@shared/core/components/ui";
import { Account } from "@shared/features/account/account.types";
import {
    Eye,
    Ban,
    CheckCircle,
    UserCircle2,
    Phone,
    Shield,
    Activity,
    StickyNote,
    Venus,
    Mars,
    CircleHelp,
    Store,
} from "lucide-react";
import { buildImageUrl } from "@shared/core";
import clsx from "clsx";

interface AccountTableProps {
    accounts: Account[];
    onSelect: (id: string) => void;
    toggleBanAccount: (id: string) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
    accounts,
    onSelect,
    toggleBanAccount,
}) => {
    const columns = useMemo(
        () => [
        {
            key: "user",
            title: "Người dùng",
            icon: UserCircle2,
            iconColor: "text-indigo-600",
            align: "left" as const,
            // width: 250,
            render: (acc: any) => {
            const userInfo = acc.userInfoId;
            const avatarUrl =
                typeof userInfo === "object"
                ? buildImageUrl(userInfo.avatar)
                : undefined;
            return (
                <div className="flex items-center gap-3">
                <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow-sm"
                />
                <div className="flex flex-col items-start"> {/* ← đây */}
                    <span className="font-semibold text-gray-800">
                    {acc.username}
                    </span>
                    {userInfo && (
                    <span className="text-gray-500 text-sm">{userInfo.name}</span>
                    )}
                </div>
                </div>
            );
            },
        },
        {
            key: "phoneNumber",
            title: "SĐT",
            icon: Phone,
            iconColor: "text-indigo-600",
            align: "center" as const,
            render: (acc: any) => (
            <span className="text-gray-700 font-medium">{acc.phoneNumber}</span>
            ),
        },
        {
            key: "roles",
            title: "Vai trò",
            icon: Shield,
            iconColor: "text-indigo-600",
            align: "center" as const,
            render: (acc: any) => (
            <div className="flex flex-wrap gap-1">
                {acc.roles.map((r: any) => (
                <span
                    key={r._id}
                    className="bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm"
                >
                    {r.roleName}
                </span>
                ))}
            </div>
            ),
        },
        {
            key: "gender",
            title: "Giới tính",
            icon: UserCircle2,
            iconColor: "text-indigo-600",
            align: "center" as const,
            render: (acc: any) => {
            const gender = acc.userInfoId?.gender;
            if (gender === "male")
                return (
                <div className="flex items-center justify-center gap-1 text-blue-700">
                    <Mars size={16} />
                    <span className="bg-blue-100 px-2 py-0.5 rounded-full text-xs font-medium">
                    Nam
                    </span>
                </div>
                );
            if (gender === "female")
                return (
                <div className="flex items-center justify-center gap-1 text-pink-700">
                    <Venus size={16} />
                    <span className="bg-pink-100 px-2 py-0.5 rounded-full text-xs font-medium">
                    Nữ
                    </span>
                </div>
                );
            return (
                <div className="flex items-center justify-center gap-1 text-purple-700">
                <CircleHelp size={16} />
                <span className="bg-purple-100 px-2 py-0.5 rounded-full text-xs font-medium">
                    Khác
                </span>
                </div>
            );
            },
        },
        {
            key: "status",
            title: "Trạng thái",
            icon: Activity,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 300,
            render: (acc: any) => {
            const isActive = !acc.isBanned && acc.status === "active";
            const isBanned = acc.isBanned;
            return (
                <div className="flex items-center justify-center gap-2">
                {isBanned ? (
                    <Ban className="text-red-500" size={18} />
                ) : isActive ? (
                    <CheckCircle className="text-green-500" size={18} />
                ) : (
                    <CircleHelp className="text-gray-400" size={18} />
                )}
                <span
                    className={clsx(
                    "px-2 py-0.5 rounded text-sm font-medium shadow-sm",
                    isBanned
                        ? "bg-red-100 text-red-700"
                        : isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                >
                    {isBanned
                    ? "Bị khóa"
                    : isActive
                    ? "Đang hoạt động"
                    : "Không hoạt động"}
                </span>
                </div>
            );
            },
        },
        {
            key: "lastActiveVN",
            title: "Ghi chú",
            icon: StickyNote,
            iconColor: "text-indigo-600",
            align: "center" as const,
            render: (acc: any) => (
            <span className="text-gray-600 text-sm italic">
                {acc.lastActiveVN || "—"}
            </span>
            ),
        },
        {
            key: "actions",
            title: "Hành động",
            icon: Store,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 140,
            render: (acc: any) => (
                <div className="flex justify-center gap-3">
                    
                    {/* Nút xem chi tiết */}
                    <div className="relative inline-block">
                        <button
                            onClick={() => onSelect(acc._id)}
                            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 shadow-md transition peer"
                        >
                            <Eye size={18} className="text-blue-600" />
                        </button>
                        <SidebarTooltip position="left" label="Xem chi tiết" />
                    </div>

                    {/* Nút khóa / mở khóa */}
                    <div className="relative inline-block">
                        <button
                            onClick={() => toggleBanAccount(acc._id)}
                            className={clsx(
                                "p-2 rounded-lg shadow-md transition peer",
                                acc.isBanned
                                    ? "bg-green-100 hover:bg-green-200 text-green-700"
                                    : "bg-red-100 hover:bg-red-200 text-red-700"
                            )}
                        >
                            {acc.isBanned ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                        <SidebarTooltip position="left" label={acc.isBanned ? "Mở khóa" : "Khóa tài khoản"} />
                    </div>
                </div>

            ),
        },
        ],
        [onSelect, toggleBanAccount]
    );

    return (
        <div className="rounded-3xl shadow-2xl overflow-visible bg-white border border-gray-200">
            <Table
                columns={columns}
                data={accounts}
                showIndex
                sttIconColor="text-indigo-600"
                rowsPerPage={5}
                headerColor="bg-gradient-to-r from-blue-100 via-indigo-200 to-pink-100 text-indigo-600 font-extrabold tracking-wider shadow-md"
                paginationBg="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
                paginationActiveColor="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-white font-semibold shadow-md"
                paginationTextColor="text-indigo-600 font-medium"
                paginationHoverColor="hover:bg-gradient-to-r hover:from-blue-100 hover:via-indigo-150 hover:to-purple-100"
            />

        </div>
    );
};

        // <Table
        //     columns={columns}
        //     data={accounts}
        //     showIndex
        //     sttIconColor="text-white"
        //     rowsPerPage={5}
        //     headerColor="bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 text-white font-semibold tracking-wider shadow-md"
        //     paginationBg="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"
        //     paginationActiveColor="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white font-semibold shadow-lg"
        //     paginationTextColor="text-gray-700 font-medium"
        //     paginationHoverColor="hover:bg-gradient-to-r hover:from-gray-200 hover:via-gray-300 hover:to-gray-400"
        // />

        // <Table
        //     columns={columns}
        //     data={accounts}
        //     showIndex
        //     sttIconColor="text-white"
        //     rowsPerPage={5}
        //     headerColor="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white font-extrabold tracking-wider shadow-lg"
        //     paginationBg="bg-gradient-to-r from-teal-50 via-teal-100 to-teal-50"
        //     paginationActiveColor="bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 text-white font-semibold shadow-lg"
        //     paginationTextColor="text-teal-700 font-medium"
        //     paginationHoverColor="hover:bg-gradient-to-r hover:from-teal-100 hover:via-teal-200 hover:to-teal-300"
        // />

