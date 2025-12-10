import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
	productId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Product",
		required: true,
	},
	productVariantId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "ProductVariant",
		required: true,
	},
	quantity: { type: Number, required: true, min: 1 },

	// Giá cuối cùng lúc order (đã tính base + adjustment)
	finalPriceAtOrder: { type: Number, required: true },

	// Snapshot thông tin hiển thị
	pdNameAtOrder: { type: String, required: true },
	imageAtOrder: { type: String },
	attributesAtOrder: [
		{
			attributeName: String,
			valueName: String,
		},
	],
});

const orderSchema = new mongoose.Schema(
	{
		orderCode: { type: String, index: true },
		accountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Account",
			required: true,
		},
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Shop",
			required: true,
		},

		orderItems: [orderItemSchema],

		// Tổng giá trị & thanh toán
		totalAmount: { type: Number, required: true }, // sum(item.finalPriceAtOrder * qty)

		// Thông tin giao hàng
		addressLine: { type: String, required: true },
		receiverName: { type: String, required: true },
		phone: { type: String, required: true },
		note: String,

		// Trạng thái đơn hàng
		status: {
			type: String,
			enum: [
				"pending",
				"packing",
				"shipping",
				"delivered",
				"completed",
				// "confirmed",
				"cancelled",
			],
			default: "pending",
		},
		statusHistory: [
			{
				status: String,
				changedAt: { type: Date, default: Date.now },
				note: String,
			},
		],

		deliverAt: Date,
	},
	{ timestamps: true }
);

orderSchema.index({ accountId: 1, shopId: 1, status: 1 });

export default mongoose.model("Order", orderSchema);
