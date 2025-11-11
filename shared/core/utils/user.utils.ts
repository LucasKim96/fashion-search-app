import { getRoleLabel, mapBackendRole } from "./role.utils";
import { buildImageUrl } from "./image.utils";

export const extractUserDisplayInfo = (authUser: any) => {
    if (!authUser) return {};

    const userInfo = authUser.userInfoId || {};
    const firstRole = authUser.roles?.[0];
    const roleKey = firstRole ? mapBackendRole(firstRole) : undefined;

    return {
        id: authUser._id,
        username: authUser.username,
        name: userInfo.name,
        email: userInfo.email,
        avatar: buildImageUrl(userInfo.avatar),
        roleLabel: getRoleLabel(roleKey),
    };
};
