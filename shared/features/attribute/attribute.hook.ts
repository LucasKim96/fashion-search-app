// // shared/features/attribute/attribute.hook.ts
// "use client";

// import { useState, useCallback, useMemo } from "react";
// import * as AttributeApi from "./attribute.api";
// import {
//     AttributeWithValues,
//     FlexibleAttributesData,
//     GetAttributesFlexibleParams,
//     UpdateAttributeLabelRequest,
// } from "./attribute.types";
// import { ApiResponse } from "@shared/types/common.types";
// import { useNotification, errorUtils } from "@shared/core";
// import { useAuth } from "../auth";
// import { mapBackendRoles, RoleKey, getRoleLevel } from "@shared/core";

// export const useAttribute = () => {
//     const { showToast } = useNotification();

//     // ====== Hook tạo state chung ======
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

//         // Memo hóa để object không bị recreate mỗi render
//         return useMemo(
//             () => ({
//                 data,
//                 loading,
//                 error,
//                 run,
//                 setData,
//             }),
//             [data, loading, error, run]
//         );
//     };

    

//     // ====== States ======
//     const publicAttributeState = createApiState<AttributeWithValues>();
//     const adminAttributesState = createApiState<FlexibleAttributesData>();
//     const shopAttributesState = createApiState<FlexibleAttributesData>();

//     const createdAdminAttributeState = createApiState<AttributeWithValues>();
//     const updatedAdminAttributeState = createApiState<AttributeWithValues>();
//     const createdShopAttributeState = createApiState<AttributeWithValues>();
//     const updatedShopAttributeState = createApiState<AttributeWithValues>();

//     const { user } = useAuth(); // user hiện tại

//     // ====== Helper: chạy API rồi refresh ======
//     const runAndRefresh = useCallback(
//         async <T,>(
//             apiCall: () => Promise<ApiResponse<T>>,
//             refreshFn?: () => void
//         ) => {
//             const res = await apiCall();
//             if (res.success && refreshFn) await refreshFn();
//             return res;
//         },
//         []
//     );

//         // ====== PUBLIC ======
//     const { run: runPublic } = publicAttributeState;

//     // const getAttributeById = useCallback(
//     //     (id: string) =>
//     //         runPublic(() => AttributeApi.getAttributeById(id)),
//     //     [runPublic]
//     // );
//     const getAttributeById = useCallback(
//         async (id: string) => {
//             const res = await runPublic(() => AttributeApi.getAttributeById(id));
//             // console.log(`📝 getAttributeById(${id}) result:`, res);
//             return res;
//         },
//         [runPublic]
//     );
    
//     // Delete attribute
//     const deleteAttribute = useCallback(
//         (id: string) => runAndReloadByRole(() => AttributeApi.deleteAttribute(id)),
//         [runAndReloadByRole]
//     );

//     // Toggle status
//     const toggleAttributeStatus = useCallback(
//         (id: string) => runAndReloadByRole(() => AttributeApi.toggleAttributeStatus(id)),
//         [runAndReloadByRole]
//     );

//     // ====== ADMIN ACTIONS ======
//     const { run: runAdmin } = adminAttributesState;
//     const { run: runCreatedAdmin } = createdAdminAttributeState;
//     const { run: runUpdatedAdmin } = updatedAdminAttributeState;

//     const reloadAdminAttributes = useCallback(async () => {
//         const res = await AttributeApi.getAdminAttributes();
//         if (res.success) {
//             adminAttributesState.setData(res.data);
//         }
//         return res;
//     }, [adminAttributesState]);
//     // helper chạy API + reload danh sách
//     const runAndReloadAdmin = useCallback(
//     async (apiCall: () => Promise<ApiResponse<any>>) => {
//         const res = await runUpdatedAdmin(async () => {
//         const r = await apiCall();
//         if (r.success) await reloadAdminAttributes();
//         return r;
//         });
//         return res;
//     },
//     [runUpdatedAdmin, reloadAdminAttributes]
//     );


//     const getAdminAttributes = useCallback(
//     async (params?: GetAttributesFlexibleParams) => {
//         const res = await runAdmin(() => AttributeApi.getAdminAttributes(params));
//         // console.log("🚀 getAdminAttributes result:", res); // log kết quả API
//         return res;
//     },
//     [runAdmin]
//     );

//     const searchAdminAttributes = useCallback(
//         async (params: { query?: string; page?: number; limit?: number }) => {
//             const res = await runAdmin(() =>
//                 AttributeApi.searchAdminAttributes({
//                     ...params,
//                     query: params.query?.trim() || undefined,
//                 })
//             );
//             // console.log("🔍 searchAdminAttributes result:", res);
//             return res;
//         },
//         [runAdmin]
//     );

//     const createAdminAttribute = useCallback(
//     (payload: FormData) =>
//         runAndReloadAdmin(() => AttributeApi.createAdminAttribute(payload)),
//     [runAndReloadAdmin]
//     );

//     const updateAdminAttributeLabel = useCallback(
//         (id: string, payload: UpdateAttributeLabelRequest) =>
//             runUpdatedAdmin(
//                 () =>
//                     runAndRefresh(
//                         () => AttributeApi.updateAdminAttributeLabel(id, payload),
//                         () => getAttributeById(id)
//                     ),
//                 { showToastOnSuccess: true }
//             ),
//         [runUpdatedAdmin, getAttributeById, runAndRefresh]
//     );


//     // ====== SHOP ACTIONS ======
//     const { run: runShop } = shopAttributesState;
//     const { run: runCreatedShop } = createdShopAttributeState;
//     const { run: runUpdatedShop } = updatedShopAttributeState;

//     const getShopAttributes = useCallback(
//         (params?: GetAttributesFlexibleParams) =>
//             runShop(() => AttributeApi.getShopAttributes(params)),
//         [runShop]
//     );

//     const searchShopAttributes = useCallback(
//         (params: { query?: string; page?: number; limit?: number }) =>
//             runShop(() =>
//                 AttributeApi.searchShopAttributes({
//                     ...params,
//                     query: params.query?.trim() || undefined,
//                 })
//             ),
//         [runShop]
//     );

    
//     // reload toàn bộ danh sách shop
//     const reloadShopAttributes = useCallback(async () => {
//         const res = await AttributeApi.getShopAttributes();
//         if (res.success) shopAttributesState.setData(res.data);
//         return res;
//     }, [shopAttributesState]);

//     // helper chạy API + reload danh sách shop
//     const runAndReloadShop = useCallback(
//     async (apiCall: () => Promise<ApiResponse<any>>) => {
//         const res = await runUpdatedShop(async () => {
//         const r = await apiCall();
//         if (r.success) await reloadShopAttributes();
//         return r;
//         });
//         return res;
//     },
//     [runUpdatedShop, reloadShopAttributes]
//     );

//     const createShopAttribute = useCallback(
//     (payload: FormData) =>
//         runAndReloadShop(() => AttributeApi.createShopAttribute(payload)),
//     [runAndReloadShop]
//     );

//     const updateShopAttributeLabel = useCallback(
//     (id: string, payload: UpdateAttributeLabelRequest) =>
//         runAndReloadShop(() =>
//         AttributeApi.updateShopAttributeLabel(id, payload)
//         ),
//     [runAndReloadShop]
//     );


//     return {
//         // States
//         publicAttributeState,
//         adminAttributesState,
//         shopAttributesState,
//         createdAdminAttributeState,
//         updatedAdminAttributeState,
//         createdShopAttributeState,
//         updatedShopAttributeState,

//         // Actions
//         runAndReloadByRole,
//         fetchAttributesByRole,

//         getAttributeById,
//         deleteAttribute,
//         toggleAttributeStatus,

//         getAdminAttributes,
//         searchAdminAttributes,
//         createAdminAttribute,
//         updateAdminAttributeLabel,

//         getShopAttributes,
//         searchShopAttributes,
//         createShopAttribute,
//         updateShopAttributeLabel,
//     };
// };


// // shared/features/attribute/attribute.hook.ts
// "use client";

// import { useState, useCallback, useMemo } from "react";
// import * as AttributeApi from "./attribute.api";
// import {
//     AttributeWithValues,
//     FlexibleAttributesData,
//     GetAttributesFlexibleParams,
//     UpdateAttributeLabelRequest,
// } from "./attribute.types";
// import { ApiResponse } from "@shared/types/common.types";
// import { useNotification, errorUtils } from "@shared/core";

// export const useAttribute = () => {
//     const { showToast } = useNotification();

//     // ====== Hook tạo state chung ======
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

//         // Memo hóa để object không bị recreate mỗi render
//         return useMemo(
//             () => ({
//                 data,
//                 loading,
//                 error,
//                 run,
//                 setData,
//             }),
//             [data, loading, error, run]
//         );
//     };

//     // ====== States ======
//     const publicAttributeState = createApiState<AttributeWithValues>();
//     const adminAttributesState = createApiState<FlexibleAttributesData>();
//     const shopAttributesState = createApiState<FlexibleAttributesData>();

//     const createdAdminAttributeState = createApiState<AttributeWithValues>();
//     const updatedAdminAttributeState = createApiState<AttributeWithValues>();
//     const createdShopAttributeState = createApiState<AttributeWithValues>();
//     const updatedShopAttributeState = createApiState<AttributeWithValues>();

//         // ====== PUBLIC ======
//     const { run: runPublic } = publicAttributeState;

//     const getAttributeById = useCallback(
//         async (id: string) => {
//             const res = await runPublic(() => AttributeApi.getAttributeById(id));
//             // console.log(`📝 getAttributeById(${id}) result:`, res);
//             return res;
//         },
//         [runPublic]
//     );
    
//     // const deleteAttribute = useCallback(
//     // (id: string) => runAndReload(
//     //         () => AttributeApi.deleteAttribute(id),
//     //         () => getAttributeById(id)
//     // ),
//     // [getAttributeById, runAndReload]
//     // );

//     // const toggleAttributeStatus = useCallback(
//     //     (id: string) =>
//     //         runPublic(
//     //             () =>
//     //                 runAndRefresh(
//     //                     () => AttributeApi.toggleAttributeStatus(id),
//     //                     () => getAttributeById(id)
//     //                 ),
//     //             { showToastOnSuccess: true }
//     //         ),
//     //     [runPublic, getAttributeById, runAndRefresh]
//     // );

//     // ====== ADMIN ACTIONS ======
    
//     const { run: runAdmin } = adminAttributesState;
//     const { run: runCreatedAdmin } = createdAdminAttributeState;
//     const { run: runUpdatedAdmin } = updatedAdminAttributeState;

//     // const reloadAdminAttributes = useCallback(async () => {
//     //     const res = await AttributeApi.getAdminAttributes();
//     //     if (res.success) {
//     //         adminAttributesState.setData(res.data);
//     //     }
//     //     return res;
//     // }, [adminAttributesState]);

//     // // helper chạy API + reload danh sách
//     // const runAndReloadAdmin = useCallback(
//     // async (apiCall: () => Promise<ApiResponse<any>>) => {
//     //     const res = await runUpdatedAdmin(async () => {
//     //     const r = await apiCall();
//     //     if (r.success) await reloadAdminAttributes();
//     //     return r;
//     //     });
//     //     return res;
//     // },
//     // [runUpdatedAdmin, reloadAdminAttributes]
//     // );
//     const reloadAdminAttributes = useCallback(async () => {
//         const res = await AttributeApi.getAdminAttributes();
//         console.log("🔥 API RESPONSE:", res.data);
//         console.log("🔥 CURRENT STATE:", adminAttributesState.data);
//         if (res.success) {
//             adminAttributesState.setData(res.data);
//             console.log("🔥 AFTER SETDATA (state still old):", adminAttributesState.data);
//         }
//         return res;
//     }, []);



//     const getAdminAttributes = useCallback(
//     async (params?: GetAttributesFlexibleParams) => {
//         const res = await runAdmin(() => AttributeApi.getAdminAttributes(params));
//         // console.log("🚀 getAdminAttributes result:", res); // log kết quả API
//         return res;
//     },
//     [runAdmin]
//     );

//     const searchAdminAttributes = useCallback(
//         async (params: { query?: string; page?: number; limit?: number }) => {
//             const res = await runAdmin(() =>
//                 AttributeApi.searchAdminAttributes({
//                     ...params,
//                     query: params.query?.trim() || undefined,
//                 })
//             );
//             // console.log("🔍 searchAdminAttributes result:", res);
//             return res;
//         },
//         [runAdmin]
//     );

//     const createAdminAttribute = useCallback(
//         (payload: FormData) =>
//             createdAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.createAdminAttribute(payload); // tạo attribute
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho create
//             ),
//         [createdAdminAttributeState, reloadAdminAttributes]
//     );


//     // Cập nhật label => reload danh sách
//     const updateAdminAttributeLabel = useCallback(
//         (id: string, payload: UpdateAttributeLabelRequest) =>
//             updatedAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.updateAdminAttributeLabel(id, payload);
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho hành động
//             ),
//         [reloadAdminAttributes]
//     );


//     const hideAdminAttribute = useCallback(
//         (id: string) =>
//             updatedAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.toggleAttributeStatus(id); // gọi API ẩn
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho hành động
//             ),
//         [reloadAdminAttributes]
//     );


//     const deleteAdminAttribute = useCallback(
//         (id: string) =>
//             updatedAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.deleteAttribute(id); // gọi API xóa
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho hành động
//             ),
//         [updatedAdminAttributeState, reloadAdminAttributes]
//     );



//     // ====== SHOP ACTIONS ======
//     const { run: runShop } = shopAttributesState;
//     const { run: runCreatedShop } = createdShopAttributeState;
//     const { run: runUpdatedShop } = updatedShopAttributeState;

//     const getShopAttributes = useCallback(
//         (params?: GetAttributesFlexibleParams) =>
//             runShop(() => AttributeApi.getShopAttributes(params)),
//         [runShop]
//     );

//     const searchShopAttributes = useCallback(
//         (params: { query?: string; page?: number; limit?: number }) =>
//             runShop(() =>
//                 AttributeApi.searchShopAttributes({
//                     ...params,
//                     query: params.query?.trim() || undefined,
//                 })
//             ),
//         [runShop]
//     );

    
//     // reload toàn bộ danh sách shop
//     // const reloadShopAttributes = useCallback(async () => {
//     //     const res = await AttributeApi.getShopAttributes();
//     //     if (res.success) shopAttributesState.setData(res.data);
//     //     return res;
//     // }, [shopAttributesState]);

//     // // helper chạy API + reload danh sách shop
//     // const runAndReloadShop = useCallback(
//     // async (apiCall: () => Promise<ApiResponse<any>>) => {
//     //     const res = await runUpdatedShop(async () => {
//     //     const r = await apiCall();
//     //     if (r.success) await reloadShopAttributes();
//     //     return r;
//     //     });
//     //     return res;
//     // },
//     // [runUpdatedShop, reloadShopAttributes]
//     // );

//     // reload danh sách shop
//     const reloadShopAttributes = useCallback(async () => {
//         const res = await AttributeApi.getShopAttributes();
//         if (res.success) {
//             shopAttributesState.setData(res.data); // cập nhật danh sách shop
//         }
//         return res;
//     }, [shopAttributesState]);

//     // ====== Shop Actions ======
//     const createShopAttribute = useCallback(
//         (payload: FormData) =>
//             createdShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.createShopAttribute(payload);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho create
//             ),
//         [createdShopAttributeState, reloadShopAttributes]
//     );

//     const updateShopAttributeLabel = useCallback(
//         (id: string, payload: UpdateAttributeLabelRequest) =>
//             updatedShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.updateShopAttributeLabel(id, payload);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true }
//             ),
//         [updatedShopAttributeState, reloadShopAttributes]
//     );

//     const hideShopAttribute = useCallback(
//         (id: string) =>
//             updatedShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.toggleAttributeStatus(id);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true }
//             ),
//         [updatedShopAttributeState, reloadShopAttributes]
//     );

//     const deleteShopAttribute = useCallback(
//         (id: string) =>
//             updatedShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.deleteAttribute(id);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true }
//             ),
//         [updatedShopAttributeState, reloadShopAttributes]
//     );



//     return {
//         // States
//         publicAttributeState,
//         adminAttributesState,
//         shopAttributesState,
//         createdAdminAttributeState,
//         updatedAdminAttributeState,
//         createdShopAttributeState,
//         updatedShopAttributeState,

//         // Actions
//         getAttributeById,

//         getAdminAttributes,
//         searchAdminAttributes,
//         createAdminAttribute,
//         updateAdminAttributeLabel,
//         hideAdminAttribute,
//         deleteAdminAttribute,

//         getShopAttributes,
//         searchShopAttributes,
//         createShopAttribute,
//         updateShopAttributeLabel,
//         hideShopAttribute,
//         deleteShopAttribute
//     };
// };


// // shared/features/attribute/attribute.hook.ts
// "use client";

// import { useState, useCallback, useMemo } from "react";
// import * as AttributeApi from "./attribute.api";
// import {
//     AttributeWithValues,
//     FlexibleAttributesData,
//     GetAttributesFlexibleParams,
//     UpdateAttributeLabelRequest,
// } from "./attribute.types";
// import { ApiResponse } from "@shared/types/common.types";
// import { useNotification, errorUtils } from "@shared/core";

// export const useAttribute = () => {
//     const { showToast } = useNotification();

//     // ====== Hook tạo state chung ======
//     // const createApiState = <T,>() => {
//     //     const [data, setData] = useState<T | null>(null);
//     //     const [loading, setLoading] = useState(false);
//     //     const [error, setError] = useState<string | null>(null);

//     //     const run = useCallback(
//     //         async (
//     //             apiCall: () => Promise<ApiResponse<T>>,
//     //             options?: { showToastOnSuccess?: boolean }
//     //         ): Promise<ApiResponse<T>> => {
//     //             setLoading(true);
//     //             setError(null);

//     //             try {
//     //                 const res = await apiCall();
//     //                 if (!res.success) {
//     //                     const msg = res.message || "Lỗi API";
//     //                     setError(msg);
//     //                     showToast(msg, "error");
//     //                 } else {
//     //                     setData(res.data);
//     //                     if (options?.showToastOnSuccess) {
//     //                         showToast(res.message || "Thành công", "success");
//     //                     }
//     //                 }
//     //                 return res;
//     //             } catch (err) {
//     //                 const msg = errorUtils.parseApiError(err);
//     //                 setError(msg);
//     //                 showToast(msg, "error");
//     //                 return { success: false, message: msg, data: null };
//     //             } finally {
//     //                 setLoading(false);
//     //             }
//     //         },
//     //         [showToast]
//     //     );

//     //     // Memo hóa để object không bị recreate mỗi render
//     //     return { data, loading, error, run, setData };

//     //     return useMemo(
//     //         () => ({data, loading, error, run, setData}),
//     //         [data, loading, error, run]
//     //     );
//     // };

//     const createApiState = <T,>() => {
//         const [data, setData] = useState<T | null>(null);
//         const [loading, setLoading] = useState(false);
//         const [error, setError] = useState<string | null>(null);

//         const run = useCallback(
//             async (apiCall: () => Promise<ApiResponse<T>>, options?: { showToastOnSuccess?: boolean }) => {
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
//                         if (options?.showToastOnSuccess) showToast(res.message || "Thành công", "success");
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

//         return { data, loading, error, run, setData };
//     };


//     // ====== States ======
//     const publicAttributeState = createApiState<AttributeWithValues>();
//     const adminAttributesState = createApiState<FlexibleAttributesData>();
//     const shopAttributesState = createApiState<FlexibleAttributesData>();

//     const createdAdminAttributeState = createApiState<AttributeWithValues>();
//     const updatedAdminAttributeState = createApiState<AttributeWithValues>();
//     const createdShopAttributeState = createApiState<AttributeWithValues>();
//     const updatedShopAttributeState = createApiState<AttributeWithValues>();

//         // ====== PUBLIC ======
//     const { run: runPublic } = publicAttributeState;

//     const getAttributeById = useCallback(
//         async (id: string) => {
//             const res = await runPublic(() => AttributeApi.getAttributeById(id));
//             // console.log(`📝 getAttributeById(${id}) result:`, res);
//             return res;
//         },
//         [runPublic]
//     );

//     // ====== ADMIN ACTIONS ======
    
//     const { run: runAdmin } = adminAttributesState;

//     const reloadAdminAttributes = useCallback(async () => {
//         const res = await AttributeApi.getAdminAttributes();
//         console.log("🔥 API RESPONSE:", res.data);
//         console.log("🔥 CURRENT STATE:", adminAttributesState.data);
//         if (res.success) {
//             adminAttributesState.setData(res.data);
//             console.log("🔥 AFTER SETDATA (state still old):", adminAttributesState.data);
//         }
//         return res;
//     }, [adminAttributesState]);



//     const getAdminAttributes = useCallback(
//     async (params?: GetAttributesFlexibleParams) => {
//         const res = await runAdmin(() => AttributeApi.getAdminAttributes(params));
//         // console.log("🚀 getAdminAttributes result:", res); // log kết quả API
//         return res;
//     },
//     [runAdmin]
//     );

//     const searchAdminAttributes = useCallback(
//         async (params: { query?: string; page?: number; limit?: number }) => {
//             const res = await runAdmin(() =>
//                 AttributeApi.searchAdminAttributes({
//                     ...params,
//                     query: params.query?.trim() || undefined,
//                 })
//             );
//             // console.log("🔍 searchAdminAttributes result:", res);
//             return res;
//         },
//         [runAdmin]
//     );

//     const createAdminAttribute = useCallback(
//         (payload: FormData) =>
//             createdAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.createAdminAttribute(payload); // tạo attribute
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho create
//             ),
//         [createdAdminAttributeState, reloadAdminAttributes]
//     );

//     // Cập nhật label => reload danh sách
//     const updateAdminAttributeLabel = useCallback(
//         (id: string, payload: UpdateAttributeLabelRequest) =>
//             updatedAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.updateAdminAttributeLabel(id, payload);
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho hành động
//             ),
//         [reloadAdminAttributes]
//     );


//     const hideAdminAttribute = useCallback(
//         (id: string) =>
//             updatedAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.toggleAttributeStatus(id); // gọi API ẩn
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho hành động
//             ),
//         [reloadAdminAttributes]
//     );


//     const deleteAdminAttribute = useCallback(
//         (id: string) =>
//             updatedAdminAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.deleteAttribute(id); // gọi API xóa
//                     if (res.success) {
//                         await reloadAdminAttributes(); // reload danh sách admin
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho hành động
//             ),
//         [updatedAdminAttributeState, reloadAdminAttributes]
//     );

//     // ====== SHOP ACTIONS ======
//     const { run: runShop } = shopAttributesState;
//     const { run: runCreatedShop } = createdShopAttributeState;
//     const { run: runUpdatedShop } = updatedShopAttributeState;

//     const getShopAttributes = useCallback(
//         (params?: GetAttributesFlexibleParams) =>
//             runShop(() => AttributeApi.getShopAttributes(params)),
//         [runShop]
//     );

//     const searchShopAttributes = useCallback(
//         (params: { query?: string; page?: number; limit?: number }) =>
//             runShop(() =>
//                 AttributeApi.searchShopAttributes({
//                     ...params,
//                     query: params.query?.trim() || undefined,
//                 })
//             ),
//         [runShop]
//     );
//     // reload danh sách shop
//     const reloadShopAttributes = useCallback(async () => {
//         const res = await AttributeApi.getShopAttributes();
//         if (res.success) {
//             shopAttributesState.setData(res.data); // cập nhật danh sách shop
//         }
//         return res;
//     }, [shopAttributesState]);

//     // ====== Shop Actions ======
//     const createShopAttribute = useCallback(
//         (payload: FormData) =>
//             createdShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.createShopAttribute(payload);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true } // toast riêng cho create
//             ),
//         [createdShopAttributeState, reloadShopAttributes]
//     );

//     const updateShopAttributeLabel = useCallback(
//         (id: string, payload: UpdateAttributeLabelRequest) =>
//             updatedShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.updateShopAttributeLabel(id, payload);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true }
//             ),
//         [updatedShopAttributeState, reloadShopAttributes]
//     );

//     const hideShopAttribute = useCallback(
//         (id: string) =>
//             updatedShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.toggleAttributeStatus(id);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true }
//             ),
//         [updatedShopAttributeState, reloadShopAttributes]
//     );

//     const deleteShopAttribute = useCallback(
//         (id: string) =>
//             updatedShopAttributeState.run(
//                 async () => {
//                     const res = await AttributeApi.deleteAttribute(id);
//                     if (res.success) {
//                         await reloadShopAttributes(); // reload danh sách shop
//                     }
//                     return res;
//                 },
//                 { showToastOnSuccess: true }
//             ),
//         [updatedShopAttributeState, reloadShopAttributes]
//     );

//     return {
//         // States
//         publicAttributeState,
//         adminAttributesState,
//         shopAttributesState,
//         createdAdminAttributeState,
//         updatedAdminAttributeState,
//         createdShopAttributeState,
//         updatedShopAttributeState,

//         // Actions
//         getAttributeById,

//         getAdminAttributes,
//         searchAdminAttributes,
//         createAdminAttribute,
//         updateAdminAttributeLabel,
//         hideAdminAttribute,
//         deleteAdminAttribute,

//         getShopAttributes,
//         searchShopAttributes,
//         createShopAttribute,
//         updateShopAttributeLabel,
//         hideShopAttribute,
//         deleteShopAttribute
//     };
// };

"use client";

import { useState, useCallback } from "react";
import * as AttributeApi from "./attribute.api";
import {
    AttributeWithValues,
    FlexibleAttributesData,
    GetAttributesFlexibleParams,
    UpdateAttributeLabelRequest,
} from "./attribute.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

export const useAttribute = () => {
    const { showToast } = useNotification();

    // ====== PUBLIC STATE ======
    const [publicAttribute, setPublicAttribute] = useState<AttributeWithValues | null>(null);
    const [loadingPublic, setLoadingPublic] = useState(false);
    const [errorPublic, setErrorPublic] = useState<string | null>(null);

    // ====== ADMIN STATE ======
    const [adminAttributes, setAdminAttributes] = useState<FlexibleAttributesData | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);
    const [errorAdmin, setErrorAdmin] = useState<string | null>(null);

    // ====== SHOP STATE ======
    const [shopAttributes, setShopAttributes] = useState<FlexibleAttributesData | null>(null);
    const [loadingShop, setLoadingShop] = useState(false);
    const [errorShop, setErrorShop] = useState<string | null>(null);

    // ================= PUBLIC ACTIONS =================
    const getAttributeById = useCallback(async (id: string) => {
        setLoadingPublic(true);
        setErrorPublic(null);
        try {
        const res = await AttributeApi.getAttributeById(id);
        if (res.success) {
            setPublicAttribute(res.data);
        } else {
            setErrorPublic(res.message || "Lỗi API");
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        setErrorPublic(msg);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        } finally {
        setLoadingPublic(false);
        }
    }, [showToast]);

    // ================= ADMIN ACTIONS =================
    const getAdminAttributes = useCallback(async (params?: GetAttributesFlexibleParams) => {
        setLoadingAdmin(true);
        setErrorAdmin(null);
        try {
        const res = await AttributeApi.getAdminAttributes(params);
        if (res.success) setAdminAttributes(res.data);
        else {
            setErrorAdmin(res.message || "Lỗi API");
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
    }, [showToast]);

    const searchAdminAttributes = useCallback(async (params: { query?: string; page?: number; limit?: number }) => {
        setLoadingAdmin(true);
        setErrorAdmin(null);
        try {
        const res = await AttributeApi.searchAdminAttributes({
            ...params,
            query: params.query?.trim() || undefined,
        });
        if (res.success) setAdminAttributes(res.data);
        else {
            setErrorAdmin(res.message || "Lỗi API");
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
    }, [showToast]);

    const reloadAdminAttributes = useCallback(async () => getAdminAttributes(), [getAdminAttributes]);

    const createAdminAttribute = useCallback(async (payload: FormData) => {
        try {
        const res = await AttributeApi.createAdminAttribute(payload);
        if (res.success) {
            await reloadAdminAttributes();
            showToast(res.message || "Tạo attribute thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    const updateAdminAttributeLabel = useCallback(async (id: string, payload: UpdateAttributeLabelRequest) => {
        try {
        const res = await AttributeApi.updateAdminAttributeLabel(id, payload);
        if (res.success) {
            await reloadAdminAttributes();
            showToast(res.message || "Cập nhật label thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    const hideAdminAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.toggleAttributeStatus(id);
        if (res.success) {
            await reloadAdminAttributes();
            showToast(res.message || "Ẩn/hiện attribute thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    const deleteAdminAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.deleteAttribute(id);
        if (res.success) {
            await reloadAdminAttributes();
            showToast(res.message || "Xóa attribute thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    // ================= SHOP ACTIONS =================
    const getShopAttributes = useCallback(async (params?: GetAttributesFlexibleParams) => {
        setLoadingShop(true);
        setErrorShop(null);
        try {
        const res = await AttributeApi.getShopAttributes(params);
        if (res.success) setShopAttributes(res.data);
        else {
            setErrorShop(res.message || "Lỗi API");
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
    }, [showToast]);

    const searchShopAttributes = useCallback(async (params: { query?: string; page?: number; limit?: number }) => {
        setLoadingShop(true);
        setErrorShop(null);
        try {
        const res = await AttributeApi.searchShopAttributes({
            ...params,
            query: params.query?.trim() || undefined,
        });
        if (res.success) setShopAttributes(res.data);
        else {
            setErrorShop(res.message || "Lỗi API");
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
    }, [showToast]);

    const reloadShopAttributes = useCallback(() => getShopAttributes(), [getShopAttributes]);

    const createShopAttribute = useCallback(async (payload: FormData) => {
        try {
        const res = await AttributeApi.createShopAttribute(payload);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Tạo attribute thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    const updateShopAttributeLabel = useCallback(async (id: string, payload: UpdateAttributeLabelRequest) => {
        try {
        const res = await AttributeApi.updateShopAttributeLabel(id, payload);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Cập nhật label thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    const hideShopAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.toggleAttributeStatus(id);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Ẩn/hiện attribute thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    const deleteShopAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.deleteAttribute(id);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Xóa attribute thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    return {
        // States
        publicAttribute,
        loadingPublic,
        errorPublic,

        adminAttributes,
        loadingAdmin,
        errorAdmin,

        shopAttributes,
        loadingShop,
        errorShop,

        // Actions
        getAttributeById,
        getAdminAttributes,
        searchAdminAttributes,
        createAdminAttribute,
        updateAdminAttributeLabel,
        hideAdminAttribute,
        deleteAdminAttribute,
        getShopAttributes,
        searchShopAttributes,
        createShopAttribute,
        updateShopAttributeLabel,
        hideShopAttribute,
        deleteShopAttribute,
        reloadAdminAttributes,
        reloadShopAttributes,
    };
};
