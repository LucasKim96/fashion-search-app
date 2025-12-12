import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
	// productId: {
	// 	type: mongoose.Schema.Types.ObjectId,
	// 	ref: "Product",
	// 	required: true,
	// },
	productVariantId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "ProductVariant",
		required: true,
	},
	quantity: { type: Number, required: true, min: 1 },

	// không lưu giá/image/tên snapshot nữa
	attributes: [
		{
			attributeId: { type: mongoose.Schema.Types.ObjectId, ref: "Attribute" },
			valueId: { type: mongoose.Schema.Types.ObjectId, ref: "AttributeValue" },
		},
	],
});

const cartSchema = new mongoose.Schema(
	{
		accountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Account",
			required: true,
		},
		items: [cartItemSchema],
	},
	{ timestamps: true }
);

cartSchema.index({ accountId: 1 });

export default mongoose.model("Cart", cartSchema);
