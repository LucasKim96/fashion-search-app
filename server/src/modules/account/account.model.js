import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
	{
		username: { type: String, unique: true, required: true }, // có thể null nhưng nếu có phải unique
		phoneNumber: { type: String, unique: true, required: true },
		password: { type: String, required: true }, // lưu password đã băm
		status: { type: String, enum: ["active", "inactive"], default: "inactive" },
		lastActive: { type: Date, default: null }, // Cập nhật thời điểm hoạt động cuối
		isBanned: { type: Boolean, default: false },
		roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }], //vd:1 account có thể có nhiều role vừa là Khách hàng vừa là Chủ shop
		userInfoId: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" },
	},
	{ timestamps: true }
); // timestamps tạo createdAt và updatedAt tự động

export default mongoose.model("Account", accountSchema);
