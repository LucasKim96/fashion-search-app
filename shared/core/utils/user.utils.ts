// import { getRoleLabel, mapBackendRole } from "./role.utils";
// import { buildImageUrl } from "./image.utils";

// export const extractUserDisplayInfo = (authUser: any) => {
//     if (!authUser) return {};

//     const userInfo = authUser.userInfoId || {};
//     const firstRole = authUser.roles?.[0];
//     const roleKey = firstRole ? mapBackendRole(firstRole) : undefined;

//     return {
//         id: authUser._id,
//         username: authUser.username,
//         name: userInfo.name,
//         email: userInfo.email,
//         avatar: buildImageUrl(userInfo.avatar),
//         roleLabel: getRoleLabel(roleKey),
//     };
// };
import { 
    getRoleLabel, 
    mapBackendRoles, 
    getRoleLevel 
} from "./role.utils";
import { buildImageUrl } from "./image.utils";

export const extractUserDisplayInfo = (authUser: any) => {
    if (!authUser) return {};

    const userInfo = authUser.userInfoId || {};

    // ------ Map toàn bộ roles sang RoleKey[] ------
    const roleKeys = mapBackendRoles(authUser.roles || []);

    // ------ Lấy role có cấp độ cao nhất ------
    const highestRole = roleKeys.length
        ? roleKeys.reduce((highest, current) =>
            getRoleLevel(current) > getRoleLevel(highest) ? current : highest
        )
        : undefined;

    return {
        id: authUser._id,
        username: authUser.username,
        name: userInfo.name,
        email: userInfo.email,
        avatar: buildImageUrl(userInfo.avatar),
        roleLabel: getRoleLabel(highestRole), // lấy tên role cao nhất
        highestRole,                          // có thể cần dùng sau này
    };
};
