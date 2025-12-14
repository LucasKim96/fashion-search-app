// /server/src/utils/ai-sync.util.js

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
 * === HÀM NỘI BỘ (PRIVATE HELPERS)                                ===
 * ===================================================================
 */

/**
 * Hàm lõi để gửi một ảnh đến AI service để tạo embedding.
 * @param {string} productId - ID của sản phẩm cha.
 * @param {string} imagePath - Đường dẫn tương đối của ảnh.
 */
const addEmbeddingRequest = async (productId, imagePath) => {
	const absolutePath = path.join(process.cwd(), imagePath.substring(1));

	if (!fs.existsSync(absolutePath)) {
		console.warn(`[AI Sync] Txt2Img - File not found, skipping: ${imagePath}`);
		return;
	}

	const form = new FormData();
	form.append("product_id", productId.toString());
	form.append("image_path", imagePath);
	form.append("image", fs.createReadStream(absolutePath));

	await axios.post(INDEX_ENDPOINT, form, { headers: form.getHeaders() });
};

/**
 * Hàm lõi để gửi yêu cầu xóa embeddings.
 */
const deleteEmbeddingsRequest = async (productId, imagePaths) => {
	await axios.post(DELETE_ENDPOINT, {
		product_id: productId.toString(),
		image_paths: imagePaths,
	});
	console.log(
		`[AI Sync] Txt2Img - ✅ Requested deletion for ${imagePaths.length} images of product ${productId}.`
	);
};

/**
 * ===================================================================
 * === HÀM CÔNG KHAI (PUBLIC API) - "Bắn và Quên"                   ===
 * ===================================================================
 */

/**
 * Đồng bộ hóa (thêm) một hoặc nhiều ảnh vào AI index.
 * @param {string} productId - ID của sản phẩm.
 * @param {string|string[]} imagePaths - Một hoặc một mảng các đường dẫn ảnh.
 */
export const syncEmbeddings = (productId, imagePaths) => {
	if (!productId || !imagePaths) {
		console.warn(
			"[AI Sync] Txt2Img - Skipped: Missing productId or imagePaths."
		);
		return;
	}

	const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
	const validPaths = paths.filter(
		(p) => typeof p === "string" && p.trim() !== ""
	);

	if (validPaths.length === 0) return;

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
 * Xóa một hoặc nhiều embedding khỏi AI index.
 */
export const removeEmbeddings = (productId, imagePaths) => {
	if (!productId || !imagePaths) {
		console.warn(
			"[AI Sync] Txt2Img - Skipped removal: Missing productId or imagePaths."
		);
		return;
	}

	const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
	const validPaths = paths.filter(
		(p) => typeof p === "string" && p.trim() !== ""
	);

	if (validPaths.length === 0) return;

	console.log(
		`[AI Sync] Txt2Img - Queued ${validPaths.length} image(s) for removal for product ${productId}.`
	);

	deleteEmbeddingsRequest(productId, validPaths).catch((err) => {
		const errorDetail =
			err.response?.data?.detail || err.response?.data || err.message;
		console.error(
			`[AI Sync] Txt2Img - ❌ Error during removal for product ${productId}:`,
			JSON.stringify(errorDetail, null, 2)
		);
	});
};
