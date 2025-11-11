"use client";

import { useState, useCallback } from "react";
import { ApiResponse } from "../../types/common.types";
import { useNotification, errorUtils } from "../../core";
import * as AccountApi from "./account.api";
import {
    Account,
    UpdateAccountBasicInfoRequest,
    UpdateRolesRequest,
    ModifyRolesRequest,
    AccountStatsByStatus,
    AccountStatsBanned,
    AccountStatsByRole,
} from "./account.types";

export const useAccount = () => {
    const { showToast } = useNotification();

    // ====== Hook chung tạo state cho từng API call ======
    const createApiState = <T,>() => {
        const [data, setData] = useState<T | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const run = useCallback(
        async (apiCall: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
            setLoading(true);
            setError(null);
            try {
            const res = await apiCall();
            if (!res.success) {
                setError(res.message || "Lỗi API");
                showToast(res.message || "Lỗi API", "error");
            } else {
                setData(res.data);
            }
            return res;
            } catch (err: unknown) {
            const message = errorUtils.parseApiError(err);
            setError(message);
            showToast(message, "error");
            return { success: false, message, data: null };
            } finally {
            setLoading(false);
            }
        },
        [showToast]
        );

        return { data, loading, error, run, setData };
    };

    // ====== Các state riêng cho từng action ======
    const allAccountsState = createApiState<Account[]>();
    const accountByIdState = createApiState<Account>();
    const searchState = createApiState<Account[]>();
    const basicInfoState = createApiState<Account>();
    const updateRolesState = createApiState<Account>();
    const modifyRolesState = createApiState<Account>();
    const toggleBanState = createApiState<Account>();
    const statsByStatusState = createApiState<AccountStatsByStatus>();
    const statsBannedState = createApiState<AccountStatsBanned>();
    const statsByRoleState = createApiState<AccountStatsByRole[]>();

    // ====== Actions ======
    const fetchAllAccounts = useCallback(
        () => allAccountsState.run(() => AccountApi.getAllAccounts()),
        [allAccountsState]
    );

    const fetchAccountById = useCallback(
        (id: string) => accountByIdState.run(() => AccountApi.getAccountById(id)),
        [accountByIdState]
    );

    const searchAccounts = useCallback(
        (keyword: string) => searchState.run(() => AccountApi.searchAccounts(keyword)),
        [searchState]
    );

    // Helper: tự động fetch lại allAccountsState sau update
    const runAndRefreshAll = useCallback(
        async <T,>(apiCall: () => Promise<ApiResponse<T>>) => {
        const res = await apiCall();
        if (res.success) {
            fetchAllAccounts(); // tự động refresh danh sách
        }
        return res;
        },
        [fetchAllAccounts]
    );

    const updateBasicInfo = useCallback(
        (id: string, payload: UpdateAccountBasicInfoRequest) =>
        basicInfoState.run(() => runAndRefreshAll(() => AccountApi.updateBasicInfo(id, payload))),
        [basicInfoState, runAndRefreshAll]
    );

    const updateRoles = useCallback(
        (id: string, payload: UpdateRolesRequest) =>
        updateRolesState.run(() => runAndRefreshAll(() => AccountApi.updateRoles(id, payload))),
        [updateRolesState, runAndRefreshAll]
    );

    const modifyRoles = useCallback(
        (id: string, payload: ModifyRolesRequest) =>
        modifyRolesState.run(() => runAndRefreshAll(() => AccountApi.modifyRoles(id, payload))),
        [modifyRolesState, runAndRefreshAll]
    );

    const toggleBanAccount = useCallback(
        (id: string) =>
        toggleBanState.run(() => runAndRefreshAll(() => AccountApi.toggleBanAccount(id))),
        [toggleBanState, runAndRefreshAll]
    );

    const countByStatus = useCallback(
        () => statsByStatusState.run(() => AccountApi.countAccountsByStatus()),
        [statsByStatusState]
    );

    const countBannedAccountsStats = useCallback(
        () => statsBannedState.run(() => AccountApi.countBannedAccountsStats()),
        [statsBannedState]
    );

    const countByRole = useCallback(
        () => statsByRoleState.run(() => AccountApi.countAccountsByRole()),
        [statsByRoleState]
    );

    return {
        // States
        allAccountsState,
        accountByIdState,
        searchState,
        basicInfoState,
        updateRolesState,
        modifyRolesState,
        toggleBanState,
        statsByStatusState,
        statsBannedState,
        statsByRoleState,

        // Actions
        fetchAllAccounts,
        fetchAccountById,
        searchAccounts,
        updateBasicInfo,
        updateRoles,
        modifyRoles,
        toggleBanAccount,
        countByStatus,
        countBannedAccountsStats,
        countByRole,
    };
};
