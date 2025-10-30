import mongoose from "mongoose";

const DEFAULT_AVATAR = "/assets/avatars/default-avatar.jpg";

const userInfoSchema = new mongoose.Schema({
  name: { type: String, default: "", trim: true },
  dayOfBirth: { type: Date, default: null },
  avatar: { type: String, default: DEFAULT_AVATAR }, // có thể để URL mặc định
  email: { type: String, unique: true, sparse: true },
  gender: { type: String, enum: ["male", "female", "other"], default: "other" },
}, { timestamps: true });

export default mongoose.model("UserInfo", userInfoSchema);
