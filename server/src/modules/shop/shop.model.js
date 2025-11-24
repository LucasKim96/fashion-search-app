// Shop Model
import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
	{
		shopName: {
			type: String,
			required: true,
			trim: true,
		},
		logoUrl: {
			type: String,
			trim: true,
		},
		coverUrl: {
			type: String,
			trim: true,
		},
		description: {
			type: String,
			// required: true,
			default: "",
			trim: true,
		},
		status: {
			type: String,
			enum: ["active", "closed", "suspended"],
			default: "active",
		},

		accountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Account",
			required: true,
			unique: true,
			index: true,
		},
	},
	{ timestamps: true }
);

export default mongoose.model("Shop", shopSchema);
