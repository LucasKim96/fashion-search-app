import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import ProductAIConfig from "./productAIConfig.model.js";
import { getLastActiveString } from "../../utils/index.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import { createProductVariantsBulk } from "./productVariant.service.js";
import Shop from "../shop/shop.model.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import {
	rollbackFiles,
	backupFile,
	restoreFile,
	removeBackup,
	withTransaction,
	toObjectId,
} from "../../utils/index.js";

const MODEL_API_URL = "http://localhost:8000/img2img";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
export const PRODUCTS_PUBLIC = "/uploads/products";

// -------------------HELPER SERVICES -------------------
/**
 * Hàm chạy ngầm gửi ảnh sang AI Model để Index
 */
const indexImagesInBackground = async (productId, imagePaths, targetGroup) => {
	if (!imagePaths || imagePaths.length === 0) return;

	// Chạy async background
	(async () => {
		for (const imgRelPath of imagePaths) {
			try {
				// 1. Lấy tên file chuẩn (bỏ phần /uploads/products/ đi)
				const fileName = path.basename(imgRelPath);

				// 2. Tạo đường dẫn tuyệt đối trên ổ cứng
				// Đảm bảo PRODUCT_FOLDER đã được define đúng như bước 1
				const absolutePath = path.join(PRODUCT_FOLDER, fileName);

				// 3. Kiểm tra file có tồn tại không trước khi gửi
				if (fs.existsSync(absolutePath)) {
					const form = new FormData();
					form.append("product_id", productId.toString());

					// Quan trọng: image_id phải là tên file để sau này tìm xóa cho dễ
					form.append("image_id", fileName);

					form.append("group", targetGroup);

					// Tạo stream đọc file
					form.append("file", fs.createReadStream(absolutePath));

					// Gửi sang Python API
					await axios.post(`${MODEL_API_URL}/index`, form, {
						headers: form.getHeaders(),
					});

					console.log(`[AI] Indexed Success: ${fileName}`);
				} else {
					console.warn(`[AI] File not found on disk: ${absolutePath}`);
				}
			} catch (err) {
				// Log lỗi chi tiết nhưng không làm crash server
				console.error(
					`[AI] Index Failed [${path.basename(imgRelPath)}]:`,
					err.message
				);
			}
		}
	})();
};
//--------------------------------------------------------------------------------------

/**
 * Lấy danh sách sản phẩm
 * @param {Object} options
 * @param {String|ObjectId} [options.shopId] - Lọc sản phẩm theo shopId (nếu có)
 * @param {String|ObjectId} [options.accountId] - Nếu không có shopId, có thể truyền accountId để xác định shop
 * @param {Boolean} [options.includeInactive=false] - true => lấy cả sản phẩm ẩn; false => chỉ lấy isActive=true
 * @returns {Object} { success, message, data }
 */
// export const getAllProducts = async ({
// 	shopId,
// 	accountId,
// 	includeInactive = false,
// }) => {
// 	try {
// 		const filter = {};

// 		// --- Xác định shopId ---
// 		let resolvedShopId = null;

// 		if (shopId) {
// 			if (!mongoose.Types.ObjectId.isValid(shopId)) {
// 				throw new Error("shopId không hợp lệ");
// 			}
// 			resolvedShopId = mongoose.Types.ObjectId(shopId);
// 		} else if (accountId) {
// 			// Nếu không truyền shopId, dùng accountId để tra ra shop
// 			if (!mongoose.Types.ObjectId.isValid(accountId)) {
// 				throw new Error("accountId không hợp lệ");
// 			}

// 			const shop = await Shop.findOne({ accountId }).select("_id").lean();
// 			if (!shop) {
// 				throw new Error("Không tìm thấy shop tương ứng với accountId này");
// 			}
// 			resolvedShopId = shop._id;
// 		}

// 		if (resolvedShopId) {
// 			filter.shopId = resolvedShopId;
// 		}

// 		// --- Lọc theo trạng thái hoạt động ---
// 		if (!includeInactive) {
// 			filter.isActive = true;
// 		}

// 		// --- Truy vấn dữ liệu ---
// 		const products = await Product.find(filter)
// 			.sort({ createdAt: -1 }) // mới nhất lên trước
// 			.select("_id pdName basePrice images isActive shopId createdAt updatedAt") // chọn cột cần thiết
// 			.lean();

// 		return {
// 			success: true,
// 			message: "Lấy danh sách sản phẩm thành công",
// 			data: products,
// 		};
// 	} catch (error) {
// 		return {
// 			success: false,
// 			message: error.message || "Lỗi khi lấy danh sách sản phẩm",
// 			data: [],
// 		};
// 	}
// };
/**
 * Lấy danh sách sản phẩm (Có phân trang)
 * @param {Object} options
 * @param {String|ObjectId} [options.shopId]
 * @param {String|ObjectId} [options.accountId]
 * @param {Boolean} [options.includeInactive=false]
 * @param {Number} [options.page=1] - Trang hiện tại
 * @param {Number} [options.limit=10] - Số lượng item mỗi trang
 * @returns {Object} { success, message, data: { products, pagination } }
 */
export const getAllProducts = async ({
	shopId,
	accountId,
	includeInactive = false,
	page = 1,
	limit = 10,
}) => {
	try {
		const filter = {};

		// --- 1. Xử lý logic ShopId (Giữ nguyên) ---
		let resolvedShopId = null;
		if (shopId) {
			if (!mongoose.Types.ObjectId.isValid(shopId)) {
				throw new Error("shopId không hợp lệ");
			}
			resolvedShopId = new mongoose.Types.ObjectId(shopId); // Thêm new cho chuẩn Mongoose mới
		} else if (accountId) {
			if (!mongoose.Types.ObjectId.isValid(accountId)) {
				throw new Error("accountId không hợp lệ");
			}
			const shop = await Shop.findOne({ accountId }).select("_id").lean();
			if (!shop) {
				throw new Error("Không tìm thấy shop tương ứng với accountId này");
			}
			resolvedShopId = shop._id;
		}

		if (resolvedShopId) {
			filter.shopId = resolvedShopId;
		}

		// --- 2. Lọc theo trạng thái ---
		if (!includeInactive) {
			filter.isActive = true;
		}

		// --- 3. Xử lý Phân trang ---
		const pageNumber = parseInt(page) || 1;
		const limitNumber = parseInt(limit) || 10;
		const skip = (pageNumber - 1) * limitNumber;

		// --- 4. Truy vấn song song (Lấy data + Đếm tổng) ---
		const [products, total] = await Promise.all([
			Product.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip) // Bỏ qua số lượng item của các trang trước
				.limit(limitNumber) // Chỉ lấy số lượng limit
				.select(
					"_id pdName basePrice images isActive shopId createdAt updatedAt"
				)
				.lean(),
			Product.countDocuments(filter), // Đếm tổng số lượng thỏa điều kiện
		]);

		const totalPages = Math.ceil(total / limitNumber);

		return {
			success: true,
			message: "Lấy danh sách sản phẩm thành công",
			data: {
				products, // Mảng sản phẩm
				pagination: {
					total, // Tổng số sản phẩm
					page: pageNumber, // Trang hiện tại
					limit: limitNumber, // Giới hạn mỗi trang
					totalPages, // Tổng số trang
				},
			},
		};
	} catch (error) {
		console.error("Get products error:", error);
		return {
			success: false,
			message: error.message || "Lỗi khi lấy danh sách sản phẩm",
			data: {
				products: [],
				pagination: {
					total: 0,
					page: 1,
					limit: 10,
					totalPages: 0,
				},
			},
		};
	}
};

/**
 * Lấy chi tiết 1 sản phẩm kèm toàn bộ biến thể
 * @param {String} productId
 */
export const getProductDetail = async (productId) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID sản phẩm không hợp lệ");

		//  Lấy sản phẩm chính
		const product = await Product.findById(productId)
			.populate({
				path: "shopId",
				select: "shopName logoUrl accountId",
				populate: {
					path: "accountId",
					select: "status lastActive",
				},
			})
			.lean();

		if (!product) throw new Error("Không tìm thấy sản phẩm");

		// Lấy danh sách biến thể
		const variants = await ProductVariant.find({ productId })
			.populate({
				path: "attributes.attributeId",
				select: "label",
			})
			.populate({
				path: "attributes.valueId",
				select: "value",
			})
			.lean();

		// Map lại để dễ đọc
		const mappedVariants = variants.map((v) => ({
			_id: v._id,
			variantKey: v.variantKey,
			stock: v.stock,
			image: v.image,
			priceAdjustment: v.priceAdjustment,
			attributes: v.attributes.map((a) => ({
				attributeId: a.attributeId?._id,
				attributeLabel: a.attributeId?.label || null,
				valueId: a.valueId?._id,
				valueLabel: a.valueId?.value || null,
			})),
		}));

		// ---- BỔ SUNG THÔNG TIN TRẠNG THÁI SHOP ----
		const account = product.shopId?.accountId;

		const shopInfo = {
			_id: product.shopId._id,
			shopName: product.shopId.shopName,
			logoUrl: product.shopId.logoUrl,

			// bổ sung trạng thái shop
			isOnline: account?.status === "active",
			lastActiveAt: account?.lastActive || null,
			lastActiveText: getLastActiveString(account),

			// nếu muốn giữ lại accountId gốc
			accountId: account?._id || null,
		};

		// ---- GHI ĐÈ shopId ĐỂ GOM LẠI ----
		product.shopId = shopInfo;

		return {
			success: true,
			message: "Lấy chi tiết sản phẩm thành công",
			data: {
				...product,
				variants: mappedVariants,
			},
		};
	} catch (error) {
		// console.error("Lỗi getProductDetail:", error);
		return {
			success: false,
			message: error.message || "Không thể lấy chi tiết sản phẩm",
		};
	}
};
// export const getProductDetail = async (productId) => {
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(productId))
// 			throw new Error("ID sản phẩm không hợp lệ");

// 		//  Lấy sản phẩm chính
// 		const product = await Product.findById(productId)
// 			.populate({
// 				path: "shopId",
// 				select: "shopName logoUrl",
// 			})
// 			.lean();
// 		if (!product) throw new Error("Không tìm thấy sản phẩm");

// 		// Lấy danh sách biến thể
// 		const variants = await ProductVariant.find({ productId })
// 			.populate({
// 				path: "attributes.attributeId",
// 				select: "label",
// 			})
// 			.populate({
// 				path: "attributes.valueId",
// 				select: "value",
// 			})
// 			.lean();

// 		// Map lại để dễ đọc
// 		const mappedVariants = variants.map((v) => ({
// 			_id: v._id,
// 			variantKey: v.variantKey,
// 			stock: v.stock,
// 			image: v.image,
// 			priceAdjustment: v.priceAdjustment,
// 			attributes: v.attributes.map((a) => ({
// 				attributeId: a.attributeId?._id,
// 				attributeLabel: a.attributeId?.label || null,
// 				valueId: a.valueId?._id,
// 				valueLabel: a.valueId?.value || null,
// 			})),
// 		}));

// 		return {
// 			success: true,
// 			message: "Lấy chi tiết sản phẩm thành công",
// 			data: {
// 				...product,
// 				variants: mappedVariants,
// 			},
// 		};
// 	} catch (error) {
// 		// console.error("Lỗi getProductDetail:", error);
// 		return {
// 			success: false,
// 			message: error.message || "Không thể lấy chi tiết sản phẩm",
// 		};
// 	}
// };

/**
 * Tạo sản phẩm mới kèm biến thể
 *
 * @param {Object} payload
 *   {
 *     pdName: String,
 *     basePrice: Number,
 *     description?: String,
 *     images?: [String],          // danh sách ảnh sản phẩm
 *     accountId: String|ObjectId, // để xác định shopId
 *     variantsPayload?: Array     // nếu FE đã sinh tổ hợp biến thể
 *   }
 *
 * @returns { success, message, data }  // data = { product, variants }
 */
export const createProductWithVariantsService = async (
	payload,
	tempFiles = []
) => {
	let createdProduct = null;
	let createdVariants = [];
	// Lấy targetGroup từ payload (FE gửi lên)
	const { targetGroup = "full_body" } = payload;
	try {
		const {
			pdName,
			basePrice,
			description = "",
			images = [],
			accountId,
			variantsPayload = [],
		} = payload;

		if (!pdName || typeof pdName !== "string")
			throw new Error("Thiếu tên sản phẩm hợp lệ");
		if (isNaN(basePrice) || basePrice < 0)
			throw new Error("Giá sản phẩm không hợp lệ");
		if (!accountId) throw new Error("Thiếu accountId để xác định shop");

		// --- Lấy shopId từ accountId ---
		const shop = await Shop.findOne({ accountId }).select("_id").lean();
		if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");

		// --- Transaction để tạo sản phẩm và các biến thể ---
		await withTransaction(async (session) => {
			// Tạo sản phẩm
			const products = await Product.create(
				[
					{
						pdName,
						basePrice,
						description,
						images,
						shopId: shop._id,
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				{ session }
			);

			createdProduct = products[0]; // vì insertMany trả về mảng

			// Tạo cấu hình AI cho sản phẩm này
			await ProductAIConfig.create(
				[
					{
						productId: createdProduct._id,
						targetGroup: targetGroup, // Giá trị FE chọn (upper/lower/full)
					},
				],
				{ session }
			);

			// Tạo biến thể nếu có variantsPayload
			if (variantsPayload?.length) {
				const result = await createProductVariantsBulk(
					createdProduct._id,
					accountId,
					variantsPayload,
					tempFiles,
					session
				);
				if (!result.success) throw new Error(result.message);
				createdVariants = result.data;
			}
		});
		// Gọi AI Index (Chạy ngầm sau khi Transaction commit thành công)
		if (createdProduct && createdProduct.images?.length > 0) {
			indexImagesInBackground(
				createdProduct._id,
				createdProduct.images,
				targetGroup
			);
		}

		return {
			success: true,
			message: "Tạo sản phẩm thành công",
			data: { createdProduct, createdVariants },
		};
	} catch (error) {
		rollbackFiles(tempFiles);
		return { success: false, message: error.message };
	}
};

/**
 * Xử lý tổng hợp ảnh cho mode "add"
 * @param {String} productId - ID sản phẩm
 * @param {Array<String>} keepImages - danh sách ảnh FE muốn giữ (có thể rỗng)
 * @param {Array<String>} uploadedImages - danh sách ảnh upload mới
 * @returns {Promise<Array<String>>} danh sách ảnh mới sau khi add
 */
export const handleAddModeImages = async (
	productId,
	keepImages = [],
	uploadedImages = []
) => {
	const product = await Product.findById(productId).lean();
	if (!product) throw new Error("Không tìm thấy sản phẩm");

	const existingImages = product.images || [];

	// nếu FE có keepImages → giữ keepImages, nếu không → giữ toàn bộ ảnh cũ
	const imagesToKeep = keepImages.length > 0 ? keepImages : existingImages;

	// tổng hợp ảnh cuối cùng
	return [...imagesToKeep, ...uploadedImages];
};
/**
 * Cập nhật danh sách ảnh của sản phẩm (xóa ảnh cũ khỏi thư mục nếu có)
 * @param {String} productId
 * @param {Array<String>} images Danh sách ảnh mới
 */
export const updateProductImagesService = async (productId, newImages = []) => {
	const backups = [];
	const tempFilesToDelete = []; // ảnh mới upload nhưng rollback nếu lỗi
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID không hợp lệ");
		if (!Array.isArray(newImages))
			throw new Error("Danh sách ảnh không hợp lệ");

		const product = await Product.findById(productId);
		if (!product) throw new Error("Không tìm thấy sản phẩm");

		const oldImages = product.images || [];

		// --- Backup và xác định ảnh cũ cần xóa ---
		const imagesToDeleteForAI = [];
		for (const old of oldImages) {
			if (!newImages.includes(old)) {
				const filePath = path.join(PRODUCT_FOLDER, path.basename(old));
				if (fs.existsSync(filePath)) {
					const backup = backupFile(filePath);
					if (backup) backups.push({ original: filePath, backup });
				}
				// Lấy tên file để gửi sang AI xóa
				imagesToDeleteForAI.push(path.basename(old));
			}
		}
		// --- 2. GỌI MODEL API ĐỂ XÓA BATCH (CODE MỚI) ---
		if (imagesToDeleteForAI.length > 0) {
			(async () => {
				try {
					const form = new FormData();
					form.append("product_id", productId.toString());
					form.append("image_ids", JSON.stringify(imagesToDeleteForAI));

					await axios.post(`${MODEL_API_URL}/delete-batch`, form, {
						headers: form.getHeaders(),
					});
					console.log(
						`[AI] Deleted batch: ${imagesToDeleteForAI.length} images`
					);
				} catch (e) {
					console.error("[AI] Delete Batch Error:", e.message);
				}
			})();
		}

		// --- Xác định file mới cần rollback nếu lỗi ---
		for (const img of newImages) {
			if (!oldImages.includes(img)) {
				tempFilesToDelete.push(path.join(PRODUCT_FOLDER, path.basename(img)));
			}
		}

		// --- Cập nhật DB ---
		product.images = newImages;
		await product.save();

		// --- Commit thành công → xóa file cũ không dùng ---
		for (const b of backups) {
			if (fs.existsSync(b.original)) fs.unlinkSync(b.original);
			removeBackup(b.backup);
		}

		// --- GỌI AI INDEX (ẢNH MỚI) ---
		const imagesToAddForAI = newImages.filter(
			(img) => !oldImages.includes(img)
		);

		if (imagesToAddForAI.length > 0) {
			// Lấy targetGroup từ DB
			let aiConfig = await ProductAIConfig.findOne({ productId });
			if (!aiConfig) {
				aiConfig = await ProductAIConfig.create({
					productId,
					targetGroup: "full_body",
				});
			}

			// Gọi index background
			indexImagesInBackground(
				productId,
				imagesToAddForAI,
				aiConfig.targetGroup
			);
		}
		return {
			success: true,
			message: "Cập nhật ảnh thành công",
			data: product.toObject(),
		};
	} catch (error) {
		// --- Rollback file mới ---
		rollbackFiles(tempFilesToDelete);

		// --- Restore file cũ nếu backup ---
		for (const b of backups) restoreFile(b.backup, b.original);

		return { success: false, message: error.message };
	}
};

/**
 * Cập nhật thông tin cơ bản của sản phẩm
 * @param {String} productId
 * @param {Object} updates { pdName?, basePrice?, description? }
 */
export const updateProductBasicInfoService = async (productId, updates) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID sản phẩm không hợp lệ");

		const allowedFields = ["pdName", "basePrice", "description"];
		const updateData = {};

		for (const key of allowedFields)
			if (updates[key] != null) updateData[key] = updates[key];

		if (!Object.keys(updateData).length)
			throw new Error("Không có dữ liệu để cập nhật");

		// Kiểm tra giá nếu có basePrice
		if (updateData.basePrice != null) {
			if (isNaN(updateData.basePrice)) throw new Error("Giá không hợp lệ");
			if (updateData.basePrice < 0)
				throw new Error("Giá phải lớn hơn hoặc bằng 0");
		}

		const product = await Product.findByIdAndUpdate(
			productId,
			{ $set: updateData },
			{ new: true }
		).lean();
		if (!product) throw new Error("Không tìm thấy sản phẩm");

		return {
			success: true,
			message: "Cập nhật sản phẩm thành công",
			data: product,
		};
	} catch (error) {
		// console.error("Lỗi updateProductBasicInfoService:", error);
		return { success: false, message: error.message };
	}
};

export const toggleProductActiveAutoService = async (productId) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID không hợp lệ");

		const product = await Product.findById(productId);
		if (!product) throw new Error("Không tìm thấy sản phẩm");

		product.isActive = !product.isActive;
		await product.save();

		return {
			success: true,
			message: product.isActive ? "Sản phẩm đã hiển thị" : "Sản phẩm đã bị ẩn",
			data: product,
		};
	} catch (error) {
		return { success: false, message: error.message };
	}
};

/**
 * Xóa sản phẩm và các biến thể liên quan, rollback ảnh nếu lỗi
 */
export const deleteProductWithVariantsService = async (productId) => {
	const backups = [];
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID không hợp lệ");

		await withTransaction(async (session) => {
			const product = await Product.findById(productId).session(session);
			if (!product) throw new Error("Không tìm thấy sản phẩm");

			const variants = await ProductVariant.find({ productId }).session(
				session
			);

			const allImages = [
				...(product.images || []),
				...variants.map((v) => v.image).filter(Boolean),
			];

			// Backup ảnh
			for (const img of allImages) {
				const filePath = path.join(PRODUCT_FOLDER, path.basename(img));
				const backup = backupFile(filePath);
				if (backup) backups.push({ original: filePath, backup });

				// Xóa file gốc
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}

			await ProductVariant.deleteMany({ productId }).session(session);
			await Product.findByIdAndDelete(productId).session(session);
		});

		// Xóa backup (commit thành công)
		for (const b of backups) removeBackup(b.backup);

		// --- GỌI AI XÓA SẢN PHẨM ---
		try {
			const form = new FormData();
			form.append("product_id", productId.toString());

			// Gọi background
			axios
				.delete(`${MODEL_API_URL}/delete-product`, {
					data: form, // Axios delete gửi body qua data
					headers: form.getHeaders(),
				})
				.catch((err) => console.error("AI Delete Product Error:", err.message));
		} catch (e) {
			console.error("Lỗi gọi AI delete product:", e);
		}
		return { success: true, message: "Đã xóa sản phẩm và biến thể liên quan" };
	} catch (error) {
		// Rollback file nếu lỗi
		for (const b of backups) restoreFile(b.backup, b.original);
		return { success: false, message: error.message };
	}
};

/**
 * Thống kê số lượng sản phẩm
 * @param {Object} options
 * @param {String|ObjectId} [options.shopId] - ID cửa hàng
 * @param {String|ObjectId} [options.accountId] - ID tài khoản (nếu cần suy ra shop)
 * @param {Boolean} [options.includeInactive=false] - true => lấy cả sản phẩm ẩn
 * @returns {Object} { success, message, total }
 */
export const countProductsService = async ({
	shopId,
	accountId,
	includeInactive = false,
}) => {
	try {
		let finalShopId = shopId;

		// Nếu không có shopId mà có accountId → tìm shop theo account
		if (!finalShopId && accountId) {
			const shop = await Shop.findOne({ accountId }).select("_id");
			if (!shop) throw new Error("Không tìm thấy cửa hàng của tài khoản này.");
			finalShopId = shop._id;
		}

		// Xây filter
		const filter = {};
		if (finalShopId) filter.shopId = finalShopId;
		if (!includeInactive) filter.isActive = true;

		// Đếm số lượng sản phẩm
		const total = await Product.countDocuments(filter);

		return {
			success: true,
			message: finalShopId
				? `Tổng số sản phẩm của cửa hàng: ${total}`
				: `Tổng số sản phẩm toàn hệ thống: ${total}`,
			data: {
				total: total,
			},
		};
	} catch (error) {
		return { success: false, message: error.message, total: 0 };
	}
};

/**
 * Search products cho admin hoặc shop
 * @param {Object} options
 * @param {Boolean} options.isAdmin - true nếu admin, false nếu shop
 * @param {String} [options.accountId] - cần nếu isAdmin=false
 * @param {String} [options.query] - tìm theo tên sản phẩm
 * @param {String} [options.shopName] - chỉ admin: tìm theo tên shop
 * @param {String} [options.status] - "active" | "inactive" | "all"
 * @param {String} [options.priceRange] - "<100", "100-300", "300-500", "500-1000", "1000<"
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=20]
 */
export const searchProducts = async ({
	isAdmin,
	accountId,
	query,
	status = "all",
	priceRange,
	page = 1,
	limit = 20,
}) => {
	try {
		// --- Phân trang ---
		const safePage = Math.max(1, parseInt(page) || 1);
		const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
		const skip = (safePage - 1) * safeLimit;

		if (isAdmin) {
			// --- Admin: dùng aggregate để join shop ---
			const match = {};

			if (status === "active") match.isActive = true;
			else if (status === "inactive") match.isActive = false;

			if (priceRange) {
				const priceFilter = {};
				switch (priceRange) {
					case "<100":
						priceFilter.$lt = 100000;
						break;
					case "100-300":
						priceFilter.$gte = 100000;
						priceFilter.$lte = 300000;
						break;
					case "300-500":
						priceFilter.$gte = 300000;
						priceFilter.$lte = 500000;
						break;
					case "500-1000":
						priceFilter.$gte = 500000;
						priceFilter.$lte = 1000000;
						break;
					case "1000<":
						priceFilter.$gte = 1000000;
						break;
				}
				match.basePrice = priceFilter;
			}

			const pipeline = [
				{ $match: match },
				{
					$lookup: {
						from: "shops",
						localField: "shopId",
						foreignField: "_id",
						as: "shop",
					},
				},
				{ $unwind: "$shop" },
			];

			const q = query?.trim();
			if (q) {
				// chỉ push $match nếu q không rỗng
				pipeline.push({
					$match: {
						$or: [
							{ pdName: { $regex: q, $options: "i" } },
							{ description: { $regex: q, $options: "i" } },
							{ "shop.shopName": { $regex: q, $options: "i" } },
						],
					},
				});
			}

			pipeline.push({ $sort: { createdAt: -1 } });
			pipeline.push({ $skip: skip }, { $limit: safeLimit });

			const products = await Product.aggregate(pipeline);

			// Tính total
			const totalAgg = await Product.aggregate([
				{ $match: match },
				{
					$lookup: {
						from: "shops",
						localField: "shopId",
						foreignField: "_id",
						as: "shop",
					},
				},
				{ $unwind: "$shop" },
				...(q
					? [
							{
								$match: {
									$or: [
										{ pdName: { $regex: q, $options: "i" } },
										{ description: { $regex: q, $options: "i" } },
										{ "shop.shopName": { $regex: q, $options: "i" } },
									],
								},
							},
					  ]
					: []),
				{ $count: "total" },
			]);
			const totalCount = totalAgg[0]?.total || 0;

			return {
				success: true,
				message: "Lấy danh sách sản phẩm thành công",
				data: {
					products,
					total: totalCount,
					page: safePage,
					limit: safeLimit,
					totalPages: Math.ceil(totalCount / safeLimit),
				},
			};
		} else {
			// --- Shop mode: filter theo shopId ---
			if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
				throw new Error("accountId không hợp lệ cho chế độ shop");
			}

			// Lấy shopId từ accountId
			const shop = await Shop.findOne({ accountId }).select("_id").lean();
			if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");
			const shopId = shop._id;

			const filter = { shopId: new mongoose.Types.ObjectId(shopId) };

			const q = query?.trim();
			if (q) filter.pdName = { $regex: q, $options: "i" };

			if (status === "active") filter.isActive = true;
			else if (status === "inactive") filter.isActive = false;

			if (priceRange) {
				const priceFilter = {};
				switch (priceRange) {
					case "<100":
						priceFilter.$lt = 100000;
						break;
					case "100-300":
						priceFilter.$gte = 100000;
						priceFilter.$lte = 300000;
						break;
					case "300-500":
						priceFilter.$gte = 300000;
						priceFilter.$lte = 500000;
						break;
					case "500-1000":
						priceFilter.$gte = 500000;
						priceFilter.$lte = 1000000;
						break;
					case "1000<":
						priceFilter.$gte = 1000000;
						break;
				}
				filter.basePrice = priceFilter;
			}
			const [products, total] = await Promise.all([
				Product.find(filter)
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(safeLimit)
					.lean(),
				Product.countDocuments(filter),
			]);

			return {
				success: true,
				message: "Lấy danh sách sản phẩm thành công",
				data: {
					products,
					total,
					page: safePage,
					limit: safeLimit,
					totalPages: Math.ceil(total / safeLimit),
				},
			};
		}
	} catch (error) {
		console.error("searchProducts error:", error);
		return {
			success: false,
			message: error.message || "Lỗi khi tìm kiếm sản phẩm",
			data: { products: [], total: 0, page: 1, limit: 20, totalPages: 1 },
		};
	}
};
