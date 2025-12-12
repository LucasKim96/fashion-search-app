// migrations/001-remove-productId-from-carts.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Tải các biến môi trường (chứa chuỗi kết nối DB)
dotenv.config({ path: path.resolve("./server/.env") });

const runMigration = async () => {
	const dbUrl = process.env.MONGO_URI; // Lấy URL từ file .env của bạn
	if (!dbUrl) {
		console.error("Lỗi: Không tìm thấy biến môi trường MONGO_URI.");
		process.exit(1);
	}

	try {
		console.log("🚀 Bắt đầu migration: Xóa productId khỏi giỏ hàng...");

		// Kết nối đến MongoDB
		await mongoose.connect(dbUrl);
		console.log("✅ Đã kết nối tới MongoDB.");

		// Lấy collection 'carts'
		const cartsCollection = mongoose.connection.db.collection("carts");

		// Chạy lệnh updateMany
		const result = await cartsCollection.updateMany(
			{},
			{ $unset: { "items.$[].productId": "" } }
		);

		console.log("✨ Migration hoàn tất!");
		console.log(`- Số giỏ hàng được quét: ${result.matchedCount}`);
		console.log(`- Số giỏ hàng được cập nhật: ${result.modifiedCount}`);
	} catch (error) {
		console.error("❌ Migration thất bại:", error);
	} finally {
		// Luôn đảm bảo ngắt kết nối
		await mongoose.disconnect();
		console.log("🔌 Đã ngắt kết nối khỏi MongoDB.");
	}
};

// Chạy hàm
runMigration();
