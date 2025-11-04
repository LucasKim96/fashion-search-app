import { STORAGE_KEYS } from "../constants/storageKeys";

export const getAccessToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;

export const setAccessToken = (token: string) =>
  typeof window !== "undefined" && localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

export const clearAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};
