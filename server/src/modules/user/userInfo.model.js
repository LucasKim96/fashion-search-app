const userInfoSchema = new mongoose.Schema({
  name: { type: String, default: "", trim: true },
  dayOfBirth: { type: Date, default: null },
  avatar: { type: String, default: "" }, // có thể để URL mặc định
  email: { type: String, unique: true, sparse: true },
  gender: { type: String, enum: ["male", "female", "other"], default: "other" },
}, { timestamps: true });

export default mongoose.model("UserInfo", userInfoSchema);
