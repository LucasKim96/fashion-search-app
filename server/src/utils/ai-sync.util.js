// /server/src/utils/ai-sync.util.js

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

// Lấy URL từ biến môi trường để linh hoạt, có giá trị mặc định
const AI_API_BASE_URL = process.env.AI_API_URL || "http://localhost:8000";
const INDEX_ENDPOINT = `${AI_API_BASE_URL}/txt2img/index`;
const DELETE_ENDPOINT = `${AI_API_BASE_URL}/txt2img/delete`; // Cập nhật để dùng endpoint /delete đã gộp

/**
 * ===================================================================
 * === HÀM NỘI BỘ (PRIVATE HELPERS)                                ===
 * ===================================================================
 */

/**
 * Hàm lõi để gửi một ảnh đến AI service để tạo embedding.
 * Hàm này không còn cần 'targetGroup' nữa.
 * @param {string} productId - ID của sản phẩm cha.
 * @param {string} imagePath - Đường dẫn tương đối của ảnh (ví dụ: /uploads/products/image.jpg).
 */
const addEmbeddingRequest = async (productId, imagePath) => {
	// Chuyển đường dẫn web (/uploads/...) thành đường dẫn hệ thống (C:\project\uploads\...)
	const absolutePath = path.join(process.cwd(), imagePath.substring(1));

	if (!fs.existsSync(absolutePath)) {
		console.warn(`[AI Sync] Txt2Img - File not found, skipping: ${imagePath}`);
		return;
	}

	const form = new FormData();
	form.append("product_id", productId.toString());
	form.append("image_path", imagePath);
	form.append("image", fs.createReadStream(absolutePath));

	// Dòng form.append("target_group", ...) đã được xóa vì không còn cần thiết.

	// Gửi request đến Python API
	await axios.post(INDEX_ENDPOINT, form, {
		headers: form.getHeaders(),
		// Thêm timeout để tránh request bị treo vô hạn
		timeout: 10000, // 10 giây
	});
};

/**
 * Hàm lõi để gửi yêu cầu xóa embeddings.
 * Sử dụng endpoint /delete đã được gộp.
 * @param {string} productId - ID của sản phẩm.
 * @param {string[]} imagePaths - Mảng đường dẫn ảnh cần xóa.
 */
const deleteEmbeddingsRequest = async (productId, imagePaths) => {
	await axios.post(DELETE_ENDPOINT, {
		product_id: productId.toString(),
		image_paths: imagePaths, // Backend sẽ xử lý logic: nếu mảng rỗng -> xóa cả sản phẩm
	});
	console.log(
		`[AI Sync] Txt2Img - ✅ Requested deletion for ${imagePaths.length} images of product ${productId}.`
	);
};

/**
 * ===================================================================
 * === HÀM CÔNG KHAI (PUBLIC API) - "Bắn và Quên" (Fire and Forget) ===
 * ===================================================================
 */

/**
 * Đồng bộ hóa (thêm/cập nhật) một hoặc nhiều ảnh vào AI index.
 * @param {string} productId - ID của sản phẩm.
 * @param {string|string[]} imagePaths - Một hoặc một mảng các đường dẫn ảnh.
 */
export const syncEmbeddings = (productId, imagePaths) => {
	// Hàm này không còn nhận 'targetGroup' nữa.
	if (!productId || !imagePaths) {
		console.warn(
			"[AI Sync] Txt2Img - Skipped sync: Missing productId or imagePaths."
		);
		return;
	}

	const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
	const validPaths = paths.filter(
		(p) => typeof p === "string" && p.trim() !== ""
	);

	if (validPaths.length === 0) return;

	console.log(
		`[AI Sync] Txt2Img - Queued ${validPaths.length} image(s) for indexing for product ${productId}.`
	);

	// Gửi các request tạo embedding song song.
	Promise.all(validPaths.map((p) => addEmbeddingRequest(productId, p))).catch(
		(err) => {
			const errorDetail =
				err.response?.data?.detail || err.response?.data || err.message;
			console.error(
				`[AI Sync] Txt2Img - ❌ Error during parallel sync for product ${productId}:`,
				JSON.stringify(errorDetail, null, 2)
			);
		}
	);
};

/**
 * Xóa một hoặc nhiều embedding của sản phẩm khỏi AI index.
 * @param {string} productId - ID của sản phẩm.
 * @param {string|string[]} imagePaths - Một hoặc một mảng các đường dẫn ảnh cần xóa.
 */
export const removeEmbeddings = (productId, imagePaths) => {
	if (!productId) {
		console.warn("[AI Sync] Txt2Img - Skipped removal: Missing productId.");
		return;
	}

	// Đảm bảo imagePaths luôn là một mảng
	const paths = !imagePaths
		? []
		: Array.isArray(imagePaths)
		? imagePaths
		: [imagePaths];
	const validPaths = paths.filter(
		(p) => typeof p === "string" && p.trim() !== ""
	);

	console.log(
		`[AI Sync] Txt2Img - Queued ${validPaths.length} image(s) for removal for product ${productId}.`
	);

	// Gọi hàm lõi để gửi request xóa.
	// Logic của Python API sẽ tự hiểu: nếu mảng rỗng -> xóa cả sản phẩm.
	deleteEmbeddingsRequest(productId, validPaths).catch((err) => {
		const errorDetail =
			err.response?.data?.detail || err.response?.data || err.message;
		console.error(
			`[AI Sync] Txt2Img - ❌ Error during removal for product ${productId}:`,
			JSON.stringify(errorDetail, null, 2)
		);
	});
};
