export const USER_ENDPOINTS = {
    BASE: "/api/users",
    GET_ALL: "/api/users",
    BY_ID: (id: string) => `/api/users/${id}`,
    BY_EMAIL: (email: string) => `/api/users/email/${email}`,
    UPDATE_BASIC_INFO: (id: string) => `/api/users/basic-info/${id}`,
    UPDATE_AVATAR: (id: string) => `/api/users/avatar/${id}`,
    UPDATE_DEFAULT_AVATAR: "/api/users/default-avatar",
    SEARCH: (keyword: string) => `/api/users/search?keyword=${keyword}`,
    STATS_GENDER: "/api/users/stats/gender",
    STATS_AGE: "/api/users/stats/age",
};
