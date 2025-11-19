"use client";

import React from "react";
import clsx from "clsx";
import { User, Search, Grid, Unlock, Lock, ShoppingCart, ShieldCheck, ShoppingBag } from "lucide-react";
import { AccountStatsBanned, AccountStatsByRole } from "@shared/features/account/";
import { SearchHeader } from "@shared/core";

interface AccountFiltersProps {
    displayMode: "CUSTOMER" | "SHOP_OWNER" | "CUSTOMER_SHOP" | "ADMIN_SUPER";
    setDisplayMode: (mode: "CUSTOMER" | "SHOP_OWNER" | "CUSTOMER_SHOP" | "ADMIN_SUPER") => void;
    showBanned: boolean | null;
    setShowBanned: (value: boolean | null) => void;
    searchKeyword: string;
    setSearchKeyword: (value: string) => void;
    statsBanned?: AccountStatsBanned | null;
    statsByRole?: AccountStatsByRole[] | null;
}

export const AccountFilters: React.FC<AccountFiltersProps> = ({
    displayMode,
    setDisplayMode,
    showBanned,
    setShowBanned,
    searchKeyword,
    setSearchKeyword,
    statsBanned,
    statsByRole
    }) => {
    const roleButtons = [
        { label: "Khách hàng", value: "CUSTOMER", color: "from-blue-500 to-indigo-500", icon: <User size={18} /> },
        { label: "Chủ shop", value: "SHOP_OWNER", color: "from-indigo-500 to-indigo-600", icon: <ShoppingCart size={18} /> },
        // { label: "Khách/Shop", value: "CUSTOMER_SHOP", color: "from-indigo-400 to-indigo-500", icon: <ShoppingBag size={18} /> },
        { label: "Admins", value: "ADMIN_SUPER", color: "from-indigo-600 to-purple-600", icon: <ShieldCheck size={18} /> },
    ];

    const bannedButtons = [
        { label: "Tất cả", value: null, color: "from-gray-400 via-gray-350 to-gray-600", icon: <Grid size={18} />, count: statsBanned?.banned! + statsBanned?.unbanned! },
        { label: "Chưa chặn", value: false, color: "from-green-400 via-green-500 to-green-600", icon: <Unlock size={18} />, count: statsBanned?.unbanned ?? 0 },
        { label: "Đã chặn", value: true, color: "from-red-400 via-red-500 to-red-600", icon: <Lock size={18} />, count: statsBanned?.banned ?? 0 },
    ];   

    return (
        <div className="flex flex-col gap-4 p-6 bg-white rounded-3xl shadow-2xl">
            {/* <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-3xl font-semibold text-gray-700 tracking-tight">
                    QUẢN LÝ TÀI KHOẢN
                </h2>

                <div className="relative w-[40%] min-w-[250px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                    <input
                    type="text"
                    placeholder="Tìm kiếm tên, tên đăng nhập, số điện thoại..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-3xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 shadow-lg transition-all duration-300 placeholder-gray-400 text-sm font-medium"
                    />
                </div>
            </div> */}

            <SearchHeader
                title="QUẢN LÝ TÀI KHOẢN"
                searchPlaceholder="Tìm kiếm tên, tên đăng nhập, số điện thoại..."
                searchValue={searchKeyword}
                onSearchChange={setSearchKeyword}
            />


            {/* Buttons Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                {/* Display Mode */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-2xl shadow-inner border border-gray-200 flex-1">
                    <span className="font-semibold text-gray-600 text-sm mr-2">Loại tài khoản:</span>
                    {roleButtons.map((item) => {
                        const count =
                            item.value === "CUSTOMER"
                                ? statsByRole?.find(r => r.roleName === "Khách hàng")?.count ?? 0
                                : item.value === "SHOP_OWNER"
                                ? statsByRole?.find(r => r.roleName === "Chủ shop")?.count ?? 0
                                : item.value === "ADMIN_SUPER"
                                ? statsByRole
                                    ?.filter(r => ["Quản trị viên", "Super Admin"].includes(r.roleName))
                                    .reduce((sum, r) => sum + r.count, 0)
                                : 0;
                        return (
                            <button
                                key={item.value}
                                onClick={() => setDisplayMode(item.value as any)}
                                className={clsx(
                                    "relative flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 text-sm",
                                    displayMode === item.value
                                        ? `bg-gradient-to-r ${item.color} text-white`
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )}
                            >
                                {item.icon}
                                {item.label}
                                {count > 0 && (
                                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Banned Filter */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-2xl shadow-inner border border-gray-200 flex-1">
                    <span className="font-semibold text-gray-600 text-sm mr-2">Trạng thái khóa:</span>
                    {bannedButtons.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setShowBanned(item.value)}
                            className={clsx(
                                "relative flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5",
                                showBanned === item.value
                                    ? `bg-gradient-to-r ${item.color} text-white`
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            )}
                        >
                            {item.icon}
                            {item.label}
                            {item.count > 0 && (
                                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
