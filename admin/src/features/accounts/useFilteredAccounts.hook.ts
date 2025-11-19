"use client";

import { useMemo } from "react";
import { Account } from "@shared/features/account/account.types";

export const useFilteredAccounts = (
    accounts: Account[] | undefined,
    displayMode: "CUSTOMER_SHOP" | "SHOP_OWNER" | "CUSTOMER" | "ADMIN_SUPER",
    showBanned: boolean | null,
    searchKeyword: string
) => {
    return useMemo(() => {
        if (!accounts) return [];

        const filtered = accounts.filter((acc) => {
            const roleMap = {
            CUSTOMER: ["Khách hàng"],
            SHOP_OWNER: ["Chủ shop"],
            CUSTOMER_SHOP: ["Khách hàng", "Chủ shop"],
            ADMIN_SUPER: ["Quản trị viên", "Super Admin"],
            };
            const hasRole = acc.roles.some(r => roleMap[displayMode].includes(r.roleName));

            const matchesBanned =
                showBanned === null ? true : showBanned ? acc.isBanned : !acc.isBanned;

            // const matchesSearch = searchKeyword
            //     ? acc.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            //     String(acc.phoneNumber).includes(searchKeyword) ||
            //     (typeof acc.userInfoId === "object" &&
            //         acc.userInfoId.name.toLowerCase().includes(searchKeyword.toLowerCase()))
            //     : true;
            const userName =
            typeof acc.userInfoId === "object" && acc.userInfoId !== null
                ? acc.userInfoId.name
                : "";

            const matchesSearch = searchKeyword
            ? acc.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                String(acc.phoneNumber).includes(searchKeyword) ||
                userName.toLowerCase().includes(searchKeyword.toLowerCase())
            : true;


            return hasRole && matchesBanned && matchesSearch;
        });

        // console.log("[useFilteredAccounts] filtered:", filtered); // 🔥 log filtered accounts
        return filtered;
    }, [accounts, displayMode, showBanned, searchKeyword]);
};

