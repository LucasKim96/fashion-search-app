// shared/features/user/user.types.ts
export interface UserInfo {
  _id: string;
  name: string;
  dayOfBirth: string | null;
  avatar: string;
  email: string;
  gender: "male" | "female" | "other";
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsGender {
  _id: string;
  count: number;
}

export interface UserStatsAgeRange {
  "18-25": number;
  "26-35": number;
  "36-50": number;
  "50+": number;
}
