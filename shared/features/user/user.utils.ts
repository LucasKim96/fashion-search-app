// shared/features/user/user.utils.ts
import { UserInfo } from "./user.types";

export const getDisplayGender = (gender: UserInfo["gender"]) => {
  switch (gender) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    default:
      return "Khác";
  }
};

export const getUserAge = (dayOfBirth: string | null) => {
  if (!dayOfBirth) return "Không rõ";
  const birth = new Date(dayOfBirth);
  const age = Math.floor((Date.now() - birth.getTime()) / (365 * 24 * 60 * 60 * 1000));
  return `${age} tuổi`;
};
