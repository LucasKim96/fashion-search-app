"use client";

import { useState, useCallback } from "react";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";
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
import { Role } from "../role";
import { useAuth } from "../auth";

export const useAccount = () => {
	const { showToast } = useNotification();
	const { refreshUser, user } = useAuth();
	// ====== Hook chung tạo state cho từng API call ======
	const createApiState = <T>() => {
		const [data, setData] = useState<T | null>(null);
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);

		/**
		 * @param apiCall API call trả về ApiResponse<T>
		 * @param options.showToastOnSuccess nếu true → show toast ngay cả khi success = true
		 */
		const run = useCallback(
			async (
				apiCall: () => Promise<ApiResponse<T>>,
				options?: { showToastOnSuccess?: boolean }
			): Promise<ApiResponse<T>> => {
				setLoading(true);
				setError(null);
				try {
					const res = await apiCall();

					if (!res.success) {
						setError(res.message || "Lỗi API");
						showToast(res.message || "Lỗi API", "error");
					} else {
						setData(res.data);

						if (options?.showToastOnSuccess) {
							showToast(res.message || "Thao tác thành công", "success");
						}
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
	// ====== States cho Role ======
	const allRolesState = createApiState<Role[]>();

	// ====== Action cho Role ======
	const fetchAllRoles = useCallback(
		() => allRolesState.run(() => AccountApi.getAllRoles()),
		[allRolesState]
	);

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
		(keyword: string) => {
			if (!keyword.trim()) {
				// Nếu keyword rỗng → lấy toàn bộ accounts
				return allAccountsState.run(() => AccountApi.getAllAccounts());
			}
			return searchState.run(() => AccountApi.searchAccounts(keyword));
		},
		[searchState, allAccountsState]
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

	// Helper: tự động fetch lại allAccountsState sau update
	const runAndRefreshAll = useCallback(
		async <T>(
			apiCall: () => Promise<ApiResponse<T>>,
			refreshBanned = false
		) => {
			const res = await apiCall();
			if (res.success) {
				fetchAllAccounts(); // refresh danh sách tài khoản
				if (refreshBanned) {
					countBannedAccountsStats(); // refresh thống kê banned
				}
			}
			return res;
		},
		[fetchAllAccounts, countBannedAccountsStats]
	);

	const updateBasicInfo = useCallback(
		async (id: string, payload: UpdateAccountBasicInfoRequest) => {
			// 1. Thực hiện cập nhật
			const res = await basicInfoState.run(
				() => AccountApi.updateBasicInfo(id, payload),
				{ showToastOnSuccess: true } // sẽ hiện toast nếu success = true
			);

			// 2. Nếu thành công → refresh lại account đó
			// if (res?.success) {
			// await fetchAccountById(id);
			// }

			return res;
		},
		[basicInfoState, fetchAccountById]
	);

	const updateRoles = useCallback(
		(id: string, payload: UpdateRolesRequest) =>
			updateRolesState.run(
				() => runAndRefreshAll(() => AccountApi.updateRoles(id, payload)),
				{ showToastOnSuccess: true }
			),
		[updateRolesState, runAndRefreshAll]
	);

	const modifyRoles = useCallback(
		async (id: string, payload: ModifyRolesRequest) => {
			const res = await modifyRolesState.run(
				() => runAndRefreshAll(() => AccountApi.modifyRoles(id, payload)),
				{ showToastOnSuccess: true }
			);

			// Nếu sửa role của chính user hiện tại → refetch lại auth
			if (res.success && user?._id === id) {
				await refreshUser();
			}

			return res;
		},
		[modifyRolesState, runAndRefreshAll, refreshUser, user]
	);

	const toggleBanAccount = useCallback(
		(id: string) =>
			toggleBanState.run(
				() => runAndRefreshAll(() => AccountApi.toggleBanAccount(id), true), // true → refresh banned
				{ showToastOnSuccess: true }
			),
		[toggleBanState, runAndRefreshAll]
	);

	return {
		// States
		allRolesState,
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
		fetchAllRoles,
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
