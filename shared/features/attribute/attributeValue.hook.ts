"use client";

import { useState, useCallback } from "react";
import * as AttributeValueApi from "./attributeValue.api";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";
import {
	AttributeValue,
	UpdateAttributeValueRequest,
} from "./attributeValue.types";
import { useAttribute } from "./attribute.hook"; // import the main attribute hook

export const useAttributeValue = () => {
	const { showToast } = useNotification();
	const { reloadAdminAttributes, reloadShopAttributes } = useAttribute();

	// ================= ADMIN STATE =================
	const [adminValues, setAdminValues] = useState<AttributeValue[] | null>(null);
	const [loadingAdmin, setLoadingAdmin] = useState(false);
	const [errorAdmin, setErrorAdmin] = useState<string | null>(null);

	// ================= SHOP STATE =================
	const [shopValues, setShopValues] = useState<AttributeValue[] | null>(null);
	const [loadingShop, setLoadingShop] = useState(false);
	const [errorShop, setErrorShop] = useState<string | null>(null);

	// ================= ADMIN ACTIONS =================
	const createAdminAttributeValues = useCallback(
		async (attributeId: string, payload: FormData) => {
			setLoadingAdmin(true);
			setErrorAdmin(null);
			try {
				const res = await AttributeValueApi.createAdminAttributeValues(
					attributeId,
					payload
				);
				if (res.success) {
					//await reloadShopProducts();
					showToast(
						res.message || "Tạo giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorAdmin(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingAdmin(false);
			}
		},
		[reloadAdminAttributes, showToast]
	);

	const updateAdminAttributeValue = useCallback(
		async (
			valueId: string,
			payload: UpdateAttributeValueRequest | FormData
		) => {
			setLoadingAdmin(true);
			setErrorAdmin(null);
			try {
				const res = await AttributeValueApi.updateAdminAttributeValue(
					valueId,
					payload
				);
				if (res.success) {
					//await reloadShopProducts();
					showToast(
						res.message || "Cập nhật giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorAdmin(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingAdmin(false);
			}
		},
		[reloadAdminAttributes, showToast]
	);

	const toggleAdminAttributeValue = useCallback(
		async (valueId: string) => {
			setLoadingAdmin(true);
			setErrorAdmin(null);
			try {
				const res = await AttributeValueApi.toggleAdminAttributeValue(valueId);
				if (res.success) {
					//await reloadShopProducts();
					showToast(
						res.message || "Ẩn/hiện giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorAdmin(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingAdmin(false);
			}
		},
		[reloadAdminAttributes, showToast]
	);

	const deleteAdminAttributeValue = useCallback(
		async (valueId: string) => {
			setLoadingAdmin(true);
			setErrorAdmin(null);
			try {
				const res = await AttributeValueApi.deleteAdminAttributeValue(valueId);
				if (res.success) {
					//await reloadShopProducts();
					showToast(
						res.message || "Xóa giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorAdmin(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingAdmin(false);
			}
		},
		[reloadAdminAttributes, showToast]
	);

	// ================= SHOP ACTIONS =================
	const createShopAttributeValues = useCallback(
		async (attributeId: string, payload: FormData) => {
			setLoadingShop(true);
			setErrorShop(null);
			try {
				const res = await AttributeValueApi.createShopAttributeValues(
					attributeId,
					payload
				);
				if (res.success) {
					await reloadShopAttributes();
					showToast(
						res.message || "Tạo giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorShop(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingShop(false);
			}
		},
		[reloadShopAttributes, showToast]
	);

	const updateShopAttributeValue = useCallback(
		async (
			valueId: string,
			payload: UpdateAttributeValueRequest | FormData
		) => {
			setLoadingShop(true);
			setErrorShop(null);
			try {
				const res = await AttributeValueApi.updateShopAttributeValue(
					valueId,
					payload
				);
				if (res.success) {
					await reloadShopAttributes();
					showToast(
						res.message || "Cập nhật giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorShop(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingShop(false);
			}
		},
		[reloadShopAttributes, showToast]
	);

	const toggleShopAttributeValue = useCallback(
		async (valueId: string) => {
			setLoadingShop(true);
			setErrorShop(null);
			try {
				const res = await AttributeValueApi.toggleShopAttributeValue(valueId);
				if (res.success) {
					await reloadShopAttributes();
					showToast(
						res.message || "Ẩn/hiện giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorShop(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingShop(false);
			}
		},
		[reloadShopAttributes, showToast]
	);

	const deleteShopAttributeValue = useCallback(
		async (valueId: string) => {
			setLoadingShop(true);
			setErrorShop(null);
			try {
				const res = await AttributeValueApi.deleteShopAttributeValue(valueId);
				if (res.success) {
					await reloadShopAttributes();
					showToast(
						res.message || "Xóa giá trị attribute thành công",
						"success"
					);
				} else {
					showToast(res.message || "Lỗi API", "error");
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorShop(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingShop(false);
			}
		},
		[reloadShopAttributes, showToast]
	);

	return {
		// States
		adminValues,
		loadingAdmin,
		errorAdmin,

		shopValues,
		loadingShop,
		errorShop,

		// Admin actions
		createAdminAttributeValues,
		updateAdminAttributeValue,
		toggleAdminAttributeValue,
		deleteAdminAttributeValue,

		// Shop actions
		createShopAttributeValues,
		updateShopAttributeValue,
		toggleShopAttributeValue,
		deleteShopAttributeValue,
	};
};

// "use client";

// import { useState, useCallback, useMemo } from "react";
// import * as AttributeValueApi from "./attributeValue.api";
// import { ApiResponse } from "@shared/types/common.types";
// import { useNotification, errorUtils } from "@shared/core";
// import { AttributeValue, UpdateAttributeValueRequest } from "./attributeValue.types";

// export const useAttributeValue = () => {
//     const { showToast } = useNotification();

//     // ===== Generic API state =====
//     const createApiState = <T,>() => {
//         const [data, setData] = useState<T | null>(null);
//         const [loading, setLoading] = useState(false);
//         const [error, setError] = useState<string | null>(null);

//         const run = useCallback(
//             async (
//                 apiCall: () => Promise<ApiResponse<T>>,
//                 options?: { showToastOnSuccess?: boolean }
//             ): Promise<ApiResponse<T>> => {
//                 setLoading(true);
//                 setError(null);
//                 try {
//                     const res = await apiCall();
//                     if (!res.success) {
//                         const msg = res.message || "Lỗi API";
//                         setError(msg);
//                         showToast(msg, "error");
//                     } else {
//                         setData(res.data);
//                         if (options?.showToastOnSuccess) {
//                             showToast(res.message || "Thành công", "success");
//                         }
//                     }
//                     return res;
//                 } catch (err) {
//                     const msg = errorUtils.parseApiError(err);
//                     setError(msg);
//                     showToast(msg, "error");
//                     return { success: false, message: msg, data: null };
//                 } finally {
//                     setLoading(false);
//                 }
//             },
//             [showToast]
//         );

//         return useMemo(
//             () => ({ data, loading, error, run, setData }),
//             [data, loading, error, run]
//         );
//     };

//     // ===== States =====
//     const createdAdminValuesState = createApiState<AttributeValue[]>();
//     const updatedAdminValueState = createApiState<AttributeValue>();
//     const toggledAdminValueState = createApiState<any>();
//     const deletedAdminValueState = createApiState<any>();

//     const createdShopValuesState = createApiState<AttributeValue[]>();
//     const updatedShopValueState = createApiState<AttributeValue>();
//     const toggledShopValueState = createApiState<any>();
//     const deletedShopValueState = createApiState<any>();

//     // ===== Helper: run API + refresh =====
//     const runAndRefresh = useCallback(
//         async <T,>(apiCall: () => Promise<ApiResponse<T>>, refreshFn?: () => void) => {
//             const res = await apiCall();
//             if (res.success && refreshFn) await refreshFn();
//             return res;
//         },
//         []
//     );

//     // ================= ADMIN =================
//     const { run: runCreatedAdmin } = createdAdminValuesState;
//     const { run: runUpdatedAdmin } = updatedAdminValueState;
//     const { run: runToggledAdmin } = toggledAdminValueState;
//     const { run: runDeletedAdmin } = deletedAdminValueState;

//     const createAdminAttributeValues = useCallback(
//         (attributeId: string, payload: FormData, refreshFn?: () => void) =>
//             runCreatedAdmin(() =>
//                 runAndRefresh(() =>
//                     AttributeValueApi.createAdminAttributeValues(attributeId, payload),
//                     refreshFn
//                 ), { showToastOnSuccess: true }),
//         [runCreatedAdmin, runAndRefresh]
//     );

//     const updateAdminAttributeValue = useCallback(
//         (valueId: string, payload: UpdateAttributeValueRequest | FormData, refreshFn?: () => void) =>
//             runUpdatedAdmin(() =>
//                 runAndRefresh(() =>
//                     AttributeValueApi.updateAdminAttributeValue(valueId, payload),
//                     refreshFn
//                 ), { showToastOnSuccess: true }),
//         [runUpdatedAdmin, runAndRefresh]
//     );

//     const toggleAdminAttributeValue = useCallback(
//         (valueId: string, refreshFn?: () => void) =>
//             runToggledAdmin(() =>
//                 runAndRefresh(() => AttributeValueApi.toggleAdminAttributeValue(valueId), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [runToggledAdmin, runAndRefresh]
//     );

//     const deleteAdminAttributeValue = useCallback(
//         (valueId: string, refreshFn?: () => void) =>
//             runDeletedAdmin(() =>
//                 runAndRefresh(() => AttributeValueApi.deleteAdminAttributeValue(valueId), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [runDeletedAdmin, runAndRefresh]
//     );

//     // ================= SHOP =================
//     const { run: runCreatedShop } = createdShopValuesState;
//     const { run: runUpdatedShop } = updatedShopValueState;
//     const { run: runToggledShop } = toggledShopValueState;
//     const { run: runDeletedShop } = deletedShopValueState;

//     const createShopAttributeValues = useCallback(
//         (attributeId: string, payload: FormData, refreshFn?: () => void) =>
//             runCreatedShop(() =>
//                 runAndRefresh(() =>
//                     AttributeValueApi.createShopAttributeValues(attributeId, payload),
//                     refreshFn
//                 ), { showToastOnSuccess: true }),
//         [runCreatedShop, runAndRefresh]
//     );

//     const updateShopAttributeValue = useCallback(
//         (valueId: string, payload: UpdateAttributeValueRequest | FormData, refreshFn?: () => void) =>
//             runUpdatedShop(() =>
//                 runAndRefresh(() =>
//                     AttributeValueApi.updateShopAttributeValue(valueId, payload),
//                     refreshFn
//                 ), { showToastOnSuccess: true }),
//         [runUpdatedShop, runAndRefresh]
//     );

//     const toggleShopAttributeValue = useCallback(
//         (valueId: string, refreshFn?: () => void) =>
//             runToggledShop(() =>
//                 runAndRefresh(() => AttributeValueApi.toggleShopAttributeValue(valueId), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [runToggledShop, runAndRefresh]
//     );

//     const deleteShopAttributeValue = useCallback(
//         (valueId: string, refreshFn?: () => void) =>
//             runDeletedShop(() =>
//                 runAndRefresh(() => AttributeValueApi.deleteShopAttributeValue(valueId), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [runDeletedShop, runAndRefresh]
//     );

//     return {
//         // States
//         createdAdminValuesState,
//         updatedAdminValueState,
//         toggledAdminValueState,
//         deletedAdminValueState,

//         createdShopValuesState,
//         updatedShopValueState,
//         toggledShopValueState,
//         deletedShopValueState,

//         runAndRefresh,

//         // Admin actions
//         createAdminAttributeValues,
//         updateAdminAttributeValue,
//         toggleAdminAttributeValue,
//         deleteAdminAttributeValue,

//         // Shop actions
//         createShopAttributeValues,
//         updateShopAttributeValue,
//         toggleShopAttributeValue,
//         deleteShopAttributeValue,
//     };
// };
