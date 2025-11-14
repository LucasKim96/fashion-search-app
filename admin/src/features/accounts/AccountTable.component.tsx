"use client";

import React, { useMemo } from "react";
import { Table, SidebarTooltip } from "@shared/core/components/ui";
import { useNotification } from "@shared/core";
import { Account } from "@shared/features/account/account.types";
import {
    Eye,
    Ban,
    CheckCircle,
    UserCircle2,
    Phone,
    Activity,
    Venus,
    Mars,
    CircleHelp,
    Settings2,
    Zap,
    Lock,
    Unlock,
    Key,
    FileText,
    Info,
    ShieldCheck,
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
    const { showConfirm } = useNotification();
    const columns = useMemo(
        () => [
        {
            key: "user",
            title: "Người dùng",
            icon: UserCircle2,
            iconColor: "text-indigo-600",
            align: "left" as const,
            width: 200,
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
            width: 100,
            render: (acc: any) => (
            <span className="text-gray-700 font-medium">{acc.phoneNumber}</span>
            ),
        },
        {
            key: "roles",
            title: "Vai trò",
            icon: ShieldCheck,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 280,
            render: (acc: any) => (
                <div className="flex flex-wrap justify-center gap-2">
                {acc.roles.map((r: any) => (
                    <span
                    key={r._id}
                    className="px-3 py-1 rounded-full text-sm font-medium shadow-sm
                                bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100
                                text-indigo-800"
                    >
                    {r.roleName}
                    </span>
                ))}
                </div>
            ),
        }
        ,
        {
            key: "gender",
            title: "Giới tính",
            icon: UserCircle2,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 120,
            render: (acc: any) => {
                const gender = acc.userInfoId?.gender;
                let colorClass = "";
                let bgClass = "";
                let Icon = CircleHelp;
                let label = "Khác";

                if (gender === "male") {
                colorClass = "text-blue-700";
                bgClass = "bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100";
                Icon = Mars;
                label = "Nam";
                } else if (gender === "female") {
                colorClass = "text-pink-700";
                bgClass = "bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100";
                Icon = Venus;
                label = "Nữ";
                } else {
                colorClass = "text-purple-700";
                bgClass = "bg-gradient-to-r from-purple-100 via-purple-50 to-purple-100";
                }

                return (
                <div className={`flex items-center justify-center gap-2 ${colorClass}`}>
                    <Icon size={18} />
                    <span
                    className={clsx(
                        "px-3 py-1 rounded-full font-medium text-sm shadow-sm",
                        bgClass
                    )}
                    >
                    {label}
                    </span>
                </div>
                );
            },
        },
        {
            key: "status",
            title: "Trạng thái",
            icon: Zap,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 150,
            render: (acc: any) => {
            const isActive = !acc.isBanned && acc.status === "active";
            const isBanned = acc.isBanned;
            return (
                <div className="flex flex-col gap-1 items-center">
                <div
                    className={clsx(
                    "inline-flex items-center gap-2 px-3 py-0.5 rounded-full font-medium cursor-default w-max shadow-sm",
                    isBanned
                        ? "bg-gradient-to-r from-red-200 via-red-100 to-red-200 text-red-700"
                        : isActive
                        ? "bg-gradient-to-r from-green-200 via-green-100 to-green-200 text-green-700"
                        : "bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 text-yellow-700"
                    )}
                >
                    {/* Dot tròn nổi bật hơn */}
                    <span
                    className={`w-2 h-2 rounded-full ring-1 ring-white ${
                        isBanned ? "bg-red-500" : isActive ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    />
                    <span className="whitespace-nowrap">
                    {isBanned ? "Bị cấm" : isActive ? "Đang hoạt động" : "Không hoạt động"}
                    </span>
                </div>
                </div>
            );
            },
        },
        {
            key: "lastActiveVN",
            title: "Đăng nhập lần cuối",
            icon: Activity,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 250,
            render: (acc: any) => (
            <span className="text-gray-600 text-sm italic">
                {acc.lastActiveVN || "—"}
            </span>
            ),
        },
        {
            key: "actions",
            title: "Hành động",
            icon: Settings2,
            iconColor: "text-indigo-600",
            align: "center" as const,
            width: 140,
            render: (acc: any) => (
                <div className="flex justify-center gap-1">

                {/* Nút xem chi tiết */}
                <div className="relative inline-block">
                    <button
                    onClick={() => onSelect(acc._id)}
                    className="px-2 py-1 rounded-full 
                                bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 
                                text-blue-700 shadow-sm 
                                transition transform duration-200 
                                hover:from-blue-200 hover:via-blue-100 hover:to-blue-200 
                                hover:scale-105 active:scale-95 peer"
                    >
                    <FileText size={18} />
                    </button>
                    <SidebarTooltip position="left" label="Xem chi tiết" />
                </div>

                {/* Nút khóa / mở khóa */}
                {/* <div className="relative inline-block">
                    <button
                    onClick={() => toggleBanAccount(acc._id)}
                    className={clsx(
                        "px-2 py-1 rounded-full shadow-sm transition transform duration-200 peer",
                        acc.isBanned
                        ? "bg-green-100 hover:bg-green-200 hover:text-green-800 text-green-700 hover:scale-105 active:scale-95"
                        : "bg-red-100 hover:bg-red-200 hover:text-red-800 text-red-700 hover:scale-105 active:scale-95"
                    )}
                    >
                    {acc.isBanned ? <Key size={18} /> : <Lock size={18} />}
                    </button>
                    <SidebarTooltip position="left" label={acc.isBanned ? "Mở khóa" : "Khóa tài khoản"} />
                </div> */}
{/* Nút khóa / mở khóa */}
            <div className="relative inline-block">
              <button
                onClick={() =>
                  showConfirm({
                    message: acc.isBanned
                      ? "Bạn có chắc muốn mở khóa tài khoản này không?"
                      : "Bạn có chắc muốn khóa tài khoản này không?",
                    onConfirm: () => toggleBanAccount(acc._id),
                  })
                }
                className={clsx(
                  "px-2 py-1 rounded-full shadow-sm transition transform duration-200 peer",
                  acc.isBanned
                    ? "bg-green-100 hover:bg-green-200 hover:text-green-800 text-green-700 hover:scale-105 active:scale-95"
                    : "bg-red-100 hover:bg-red-200 hover:text-red-800 text-red-700 hover:scale-105 active:scale-95"
                )}
              >
                {acc.isBanned ? <Key size={18} /> : <Lock size={18} />}
              </button>
              <SidebarTooltip
                position="left"
                label={acc.isBanned ? "Mở khóa" : "Khóa tài khoản"}
              />
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

