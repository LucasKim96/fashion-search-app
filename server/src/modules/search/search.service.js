import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import Product from "../product/product.model.js";
import fsPromises from "fs/promises";

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
