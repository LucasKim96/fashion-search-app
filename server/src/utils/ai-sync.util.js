import axios from "axios";
import path from "path";

// URL Python API
const AI_URL = process.env.AI_API_URL || "http://localhost:8000";

// Hàm chuyển đổi String ID sang Int ID (cho FAISS nếu cần, nhưng ở service mới ta dùng String ID mapping nên có thể gửi String trực tiếp)
// Tuy nhiên, payload của bạn bên Python nhận product_id: str nên cứ gửi string.

export const syncToAI = async (productId, imagePath) => {
	try {
		// Chuyển đường dẫn tương đối (/uploads/...) thành tuyệt đối (C:/Project/uploads/...)
		// Để Python đọc được file
		const absolutePath = path.join(process.cwd(), imagePath);

		await axios.post(`${AI_URL}/txt2img/index`, {
			product_id: productId.toString(),
			image_path: absolutePath,
		});
		// console.log(`✅ Indexed: ${productId} - ${imagePath}`);
	} catch (error) {
		console.error(`❌ AI Sync Error [${productId}]:`, error.message);
	}
};

/**
 * Chỉ đồng bộ sang model Text Search (PhoCLIP)
 */
export const syncToTextAI = async (productId, imagePath) => {
	try {
		if (!imagePath) return;

		// Chuyển đổi đường dẫn tương đối trong DB (/uploads/...)
		// thành đường dẫn tuyệt đối trên ổ cứng (C:/Project/uploads/...)
		// để Python có thể mở file bằng PIL.Image.open()

		// Xóa dấu / đầu tiên nếu có để tránh lỗi path.join
		const relativePath = imagePath.startsWith("/")
			? imagePath.slice(1)
			: imagePath;
		const absolutePath = path.join(process.cwd(), relativePath);

		// Gọi API Python của BẠN
		await axios.post(`${AI_URL}/txt2img/index`, {
			product_id: productId.toString(),
			image_path: absolutePath,
		});

		console.log(`[Text-Index] ✅ Synced: ${productId}`);
	} catch (error) {
		// Log lỗi nhưng không làm crash app
		console.error(`[Text-Index] ❌ Error syncing ${productId}:`, error.message);
	}
};
