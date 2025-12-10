// server/src/utils/ai-sync.util.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Lấy URL từ biến môi trường để linh hoạt
const AI_API_BASE_URL = process.env.AI_API_URL || "http://localhost:8000";
const INDEX_ENDPOINT = `${AI_API_BASE_URL}/txt2img/index`;
const DELETE_ENDPOINT = `${AI_API_BASE_URL}/txt2img/delete-batch`;

/**
 * ===================================================================
 * === CÁC HÀM "NỘI BỘ" (PRIVATE HELPERS)                          ===
 * ===================================================================
 */

/**
 * Hàm lõi để gửi một ảnh đến AI service để tạo embedding.
 * @param {string} productId - ID của sản phẩm cha.
 * @param {string} imagePath - Đường dẫn tương đối của ảnh (ví dụ: /uploads/products/...).
 */
const addEmbeddingRequest = async (productId, imagePath) => {
	// Chuyển đường dẫn tương đối thành tuyệt đối để đọc file
	const absolutePath = path.join(process.cwd(), imagePath.substring(1));

	if (!fs.existsSync(absolutePath)) {
		console.warn(`[AI Sync] File not found, skipping embedding: ${imagePath}`);
		return; // Bỏ qua nếu file không tồn tại
	}

	const form = new FormData();
	form.append("product_id", productId.toString());
	form.append("image_path", imagePath); // Gửi đường dẫn tương đối cho AI service
	form.append("image", fs.createReadStream(absolutePath));

	// Gửi request
	await axios.post(INDEX_ENDPOINT, form, { headers: form.getHeaders() });
	console.log(`[AI Sync] ✅ Indexed: ${imagePath} for product ${productId}`);
};

/**
 * Hàm lõi để gửi yêu cầu xóa một hoặc nhiều embedding khỏi AI service.
 * @param {string} productId - ID của sản phẩm cha.
 * @param {string[]} imagePaths - Mảng các đường dẫn tương đối của ảnh cần xóa.
 */
const deleteEmbeddingsRequest = async (productId, imagePaths) => {
	await axios.post(DELETE_ENDPOINT, {
		product_id: productId.toString(),
		image_paths: imagePaths,
	});
	console.log(
		`[AI Sync] ✅ Requested deletion for ${imagePaths.length} images of product ${productId}.`
	);
};

/**
 * ===================================================================
 * === CÁC HÀM "CÔNG KHAI" (PUBLIC API) - "Bắn và Quên"            ===
 * ===================================================================
 */

/**
 * Đồng bộ hóa (thêm) một hoặc nhiều ảnh vào AI index.
 * Chạy ở chế độ nền, không làm chặn luồng chính.
 * @param {string} productId - ID của sản phẩm.
 * @param {string|string[]} imagePaths - Một hoặc một mảng các đường dẫn ảnh.
 */
export const syncEmbeddings = (productId, imagePaths) => {
	if (!productId || !imagePaths) {
		console.warn("[AI Sync] Skipped: Missing productId or imagePaths.");
		return;
	}

	const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
	const validPaths = paths.filter(
		(p) => typeof p === "string" && p.trim() !== ""
	);

	if (validPaths.length === 0) return;

	console.log(
		`[AI Sync] Queued ${validPaths.length} image(s) for indexing for product ${productId}.`
	);

	// Chạy các promise song song nhưng không await
	Promise.all(validPaths.map((p) => addEmbeddingRequest(productId, p))).catch(
		(err) => {
			const errorDetail = err.response?.data || err.message;
			console.error(
				`[AI Sync] ❌ Error during parallel sync for product ${productId}:`,
				JSON.stringify(errorDetail, null, 2)
			);
		}
	);
};

/**
 * Xóa một hoặc nhiều embedding khỏi AI index.
 * Chạy ở chế độ nền, không làm chặn luồng chính.
 * @param {string} productId - ID của sản phẩm.
 * @param {string|string[]} imagePaths - Một hoặc một mảng các đường dẫn ảnh.
 */
export const removeEmbeddings = (productId, imagePaths) => {
	if (!productId || !imagePaths) {
		console.warn("[AI Sync] Skipped removal: Missing productId or imagePaths.");
		return;
	}

	const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
	const validPaths = paths.filter(
		(p) => typeof p === "string" && p.trim() !== ""
	);

	if (validPaths.length === 0) return;

	console.log(
		`[AI Sync] Queued ${validPaths.length} image(s) for removal for product ${productId}.`
	);

	deleteEmbeddingsRequest(productId, validPaths).catch((err) => {
		const errorDetail = err.response?.data || err.message;
		console.error(
			`[AI Sync] ❌ Error during removal for product ${productId}:`,
			JSON.stringify(errorDetail, null, 2)
		);
	});
};
