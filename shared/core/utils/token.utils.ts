// const ACCESS_TOKEN_KEY = "accessToken";
// const REFRESH_TOKEN_KEY = "refreshToken";

// export const tokenUtils = {
//   getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
//   getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

//   setTokens: (access: string, refresh?: string) => {
//     localStorage.setItem(ACCESS_TOKEN_KEY, access);
//     if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
//   },

//   clearTokens: () => {
//     localStorage.removeItem(ACCESS_TOKEN_KEY);
//     localStorage.removeItem(REFRESH_TOKEN_KEY);
//   },
// };

// shared/core/utils/token.utils.ts
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const tokenUtils = {
	getAccessToken: () => {
		if (typeof window === "undefined") return null; // Chặn lỗi server
		return localStorage.getItem(ACCESS_TOKEN_KEY);
	},

	getRefreshToken: () => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	},

	setTokens: (access: string, refresh?: string) => {
		if (typeof window === "undefined") return;
		localStorage.setItem(ACCESS_TOKEN_KEY, access);
		if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
	},

	clearTokens: () => {
		if (typeof window === "undefined") return;
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	},
};
