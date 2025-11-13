import {jwtDecode} from "jwt-decode";

const ACCESS_TOKEN_KEY = "accessToken";

export interface TokenPayload {
  sub?: string;
  username?: string;
  roles?: { roleName: string; level: number }[];
  maxLevel?: number;
  [key: string]: any;
}

export const tokenUtils = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null; // chỉ client
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getDecodedToken: (): TokenPayload | null => {
    if (typeof window === "undefined") return null; // chỉ client
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  },

  getMaxLevel: (): number => {
    const decoded = tokenUtils.getDecodedToken();
    return decoded?.maxLevel || 1; // default level 1
  },

  setAccessToken: (token: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
