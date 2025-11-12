"use client";

import { useState, useCallback } from "react";
import {
  getAllUsersApi,
  getUserByIdApi,
  getUserByEmailApi,
  updateUserBasicInfoApi,
  updateUserAvatarApi,
  updateDefaultAvatarApi,
  searchUsersApi,
  statsByGenderApi,
  statsByAgeRangeApi,
} from "./user.api";
import {
  UserInfo,
  UserStatsGender,
  UserStatsAgeRange,
  DefaultAvatarResponse,
  UpdateUserBasicInfoRequest,
  UploadAvatarResponse,
} from "./user.types";
import { ApiResponse } from "../../types/common.types";
import { useNotification, errorUtils } from "../../core";

export const useUser = () => {
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
  const allUsersState = createApiState<UserInfo[]>();
  const userByIdState = createApiState<UserInfo>();
  const userByEmailState = createApiState<UserInfo>();
  const basicInfoState = createApiState<UserInfo>();
  const avatarState = createApiState<UploadAvatarResponse>();
  const defaultAvatarState = createApiState<DefaultAvatarResponse>();
  const searchState = createApiState<UserInfo[]>();
  const genderStatsState = createApiState<UserStatsGender[]>();
  const ageStatsState = createApiState<UserStatsAgeRange>();

  // ====== Actions ======
  const getAllUsers = useCallback(
    () => allUsersState.run(() => getAllUsersApi()),
    [allUsersState]
  );

  const getUserById = useCallback(
    (id: string) => userByIdState.run(() => getUserByIdApi(id)),
    [userByIdState]
  );

  const getUserByEmail = useCallback(
    (email: string) => userByEmailState.run(() => getUserByEmailApi(email)),
    [userByEmailState]
  );

  const searchUsers = useCallback(
    (keyword: string) => searchState.run(() => searchUsersApi(keyword)),
    [searchState]
  );

  const statsByGender = useCallback(
    () => genderStatsState.run(() => statsByGenderApi()),
    [genderStatsState]
  );

  const statsByAgeRange = useCallback(
    () => ageStatsState.run(() => statsByAgeRangeApi()),
    [ageStatsState]
  );

  // ====== Helper: chạy API cập nhật rồi tự động refresh allUsersState ======
  const runAndRefreshAllUsers = useCallback(
    async <T,>(apiCall: () => Promise<ApiResponse<T>>) => {
      const res = await apiCall();
      if (res.success) {
        getAllUsers(); // tự động refresh danh sách users
      }
      return res;
    },
    [getAllUsers]
  );

  // ====== Actions cập nhật ======
  const updateBasicInfo = useCallback(
    (id: string, payload: UpdateUserBasicInfoRequest) =>
      basicInfoState.run(() =>
        runAndRefreshAllUsers(() => updateUserBasicInfoApi(id, payload))
      ),
    [basicInfoState, runAndRefreshAllUsers]
  );

  const updateAvatar = useCallback(
    (id: string, file: File) =>
      avatarState.run(() =>
        runAndRefreshAllUsers(() => updateUserAvatarApi(id, file))
      ),
    [avatarState, runAndRefreshAllUsers]
  );

  const updateDefaultAvatar = useCallback(
    (file: File) =>
      defaultAvatarState.run(() =>
        runAndRefreshAllUsers(() => updateDefaultAvatarApi(file))
      ),
    [defaultAvatarState, runAndRefreshAllUsers]
  );

  return {
    // States
    allUsersState,
    userByIdState,
    userByEmailState,
    basicInfoState,
    avatarState,
    defaultAvatarState,
    searchState,
    genderStatsState,
    ageStatsState,

    // Actions
    getAllUsers,
    getUserById,
    getUserByEmail,
    updateBasicInfo,
    updateAvatar,
    updateDefaultAvatar,
    searchUsers,
    statsByGender,
    statsByAgeRange,
  };
};