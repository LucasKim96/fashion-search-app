import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import Product from "../product/product.model.js";
import fsPromises from "fs/promises";
import { apiResponse } from "../../utils/index.js";

// Cấu hình URL đến Python Server
const PYTHON_HOST = process.env.AI_API_URL || "http://localhost:8000";
const IMG_API_URL = `${PYTHON_HOST}/img2img`;
const TXT_API_URL = `${PYTHON_HOST}/txt2img`;

const MODEL_API_URL =
	process.env.MODEL_API_URL || "http://localhost:8000/img2img";

/**
 * Helper xóa file an toàn
 */
const safeUnlink = async (filePath) => {
	if (filePath && fs.existsSync(filePath)) {
		try {
			await fsPromises.unlink(filePath);
		} catch (e) {
			console.error(`Lỗi xóa file tạm [${filePath}]:`, e.message);
		}
	}
};

/**
 * Gửi ảnh sang AI để lấy danh sách Box (Candidates)
 * @returns {Promise<ApiResponse>}
 */
export const detectObjectsService = async (file) => {
	try {
		const form = new FormData();
		form.append("file", fs.createReadStream(file.path));

		// Gọi AI API (Python trả về: { candidates: [...] })
		const response = await axios.post(`${MODEL_API_URL}/detect`, form, {
			headers: form.getHeaders(),
		});

		return {
			success: true,
			message: "Phân tích ảnh thành công",
			data: {
				candidates: response.data.candidates || [],
			},
		};
	} catch (error) {
		return {
			success: false,
			message:
				error.response?.data?.detail ||
				error.message ||
				"Lỗi khi gọi AI Detect",
			data: null,
		};
	} finally {
		safeUnlink(file.path);
	}
};

/**
 * Gửi ảnh crop sang AI search -> Lấy ID -> Query DB -> Sort theo rank
 * @returns {Promise<ApiResponse>}
 */
export const searchImageService = async (file) => {
	try {
		const form = new FormData();
		form.append("file", fs.createReadStream(file.path));
		form.append("k", "20"); // Lấy top 20

		const aiResponse = await axios.post(`${MODEL_API_URL}/search`, form, {
			headers: form.getHeaders(),
		});

		// Python trả về: { results: [{ product_id, image_id, similarity, ... }] }
		const aiResults = aiResponse.data.results;

		if (!aiResults || aiResults.length === 0) {
			return {
				success: true,
				message: "Không tìm thấy sản phẩm tương tự",
				data: [],
			};
		}

		// --- BƯỚC 2: Truy vấn Database ---
		const productIds = aiResults.map((item) => item.product_id);

		// [SỬA ĐỔI]: Chỉ select các trường CÓ THẬT trong DB Product Schema
		const products = await Product.find({
			_id: { $in: productIds },
			isActive: true,
		})
			.populate("shopId", "shopName logoUrl")
			// Bỏ averageRating, soldCount, slug vì Schema không có
			.select("_id pdName basePrice images isActive shopId createdAt updatedAt")
			.lean();

		// --- BƯỚC 3: Sắp xếp & Merge thông tin AI ---
		const sortedProducts = [];
		// Tạo Map để tra cứu nhanh: ID -> Product Object
		const productMap = new Map(products.map((p) => [p._id.toString(), p]));

		aiResults.forEach((aiItem) => {
			const product = productMap.get(aiItem.product_id);
			if (product) {
				sortedProducts.push({
					...product,
					similarity: aiItem.similarity, // Thêm độ tương đồng
					matchedImage: aiItem.image_id, // Map image_id từ AI sang matchedImage cho FE
				});
			}
		});

		return {
			success: true,
			message: "Tìm kiếm thành công",
			data: sortedProducts,
		};
	} catch (error) {
		console.error("AI Service Error:", error);
		return {
			success: false,
			message:
				error.response?.data?.detail ||
				error.message ||
				"Lỗi khi gọi AI Search",
			data: null,
		};
	} finally {
		safeUnlink(file.path);
	}
};

/** ================= TEXT SEARCH SERVICES ================= */

/**
 * Tìm kiếm sản phẩm bằng văn bản (PhoCLIP)
 * @param {string} query - Từ khóa tìm kiếm
 * @param {number} limit - Số lượng kết quả
 */
export const searchByTextService = async (query, limit = 20) => {
	try {
		// 1. Gọi sang Python (PhoCLIP)
		// Python trả về: { data: [ { id, score, image }, ... ] }
		const aiResponse = await axios.post(`${TXT_API_URL}/search`, {
			query: query,
			limit: Number(limit),
		});

		const aiResults = aiResponse.data.data;

		if (!aiResults || aiResults.length === 0) {
			return {
				success: true,
				message: "Không tìm thấy sản phẩm nào phù hợp",
				data: [],
			};
		}

		// 2. Query Database
		const productIds = aiResults.map((item) => item.id);

		const productsFromDb = await Product.find({
			_id: { $in: productIds },
			isActive: true,
		})
			.populate("shopId", "shopName logoUrl")
			.select("_id pdName basePrice images isActive shopId description")
			.lean();

		// 3. Merge & Sort theo AI Rank
		const productMap = new Map(
			productsFromDb.map((p) => [p._id.toString(), p])
		);
		const finalResults = [];

		for (const aiItem of aiResults) {
			const productDb = productMap.get(aiItem.id);

			if (productDb) {
				finalResults.push({
					...productDb,
					// [QUAN TRỌNG] Gán ảnh mà AI tìm thấy vào thumbnail để FE hiển thị
					thumbnail: aiItem.image,
					similarity: aiItem.score,
				});
			}
		}

		return {
			success: true,
			message: "Tìm kiếm văn bản thành công",
			data: finalResults,
		};
	} catch (error) {
		console.error(
			"AI Text Service Error:",
			error?.response?.data || error.message
		);
		return {
			success: false,
			message: "Lỗi kết nối với hệ thống tìm kiếm AI",
			data: null,
		};
	}
};
