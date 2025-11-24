import mongoose from "mongoose";

const ProductAIConfigSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			unique: true, // 1 Sản phẩm chỉ có 1 cấu hình AI
		},
		targetGroup: {
			type: String,
			enum: ["upper_body", "lower_body", "full_body"],
			required: true,
			default: "full_body",
		},
		lastIndexedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

export default mongoose.model("ProductAIConfig", ProductAIConfigSchema);
