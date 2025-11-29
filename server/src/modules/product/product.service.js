// server/src/modules/product/product.service.js

import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import ProductAIConfig from "./productAIConfig.model.js";
import { getLastActiveString } from "../../utils/index.js";
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
import { syncEmbeddings, removeEmbeddings } from "../../utils/ai-sync.util.js";

const MODEL_API_URL = "http://localhost:8000/img2img";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
export const PRODUCTS_PUBLIC = "/uploads/products";

// -------------------HELPER SERVICES -------------------
/**
 * Hàm chạy ngầm gửi ảnh sang AI Model để Index (IMG2IMG)
 */
const indexImagesInBackground = async (productId, imagePaths, targetGroup) => {
	if (!imagePaths || imagePaths.length === 0) return;

	// Chạy async background
	(async () => {
		for (const imgRelPath of imagePaths) {
			try {
				const fileName = path.basename(imgRelPath);
				const absolutePath = path.join(PRODUCT_FOLDER, fileName);

				if (fs.existsSync(absolutePath)) {
					const form = new FormData();
					form.append("product_id", productId.toString());
					form.append("image_id", fileName);
					form.append("group", targetGroup);
					form.append("file", fs.createReadStream(absolutePath));

					await axios.post(`${MODEL_API_URL}/index`, form, {
						headers: form.getHeaders(),
					});

					console.log(`[AI] Indexed Success: ${fileName}`);
				} else {
					console.warn(`[AI] File not found on disk: ${absolutePath}`);
				}
			} catch (err) {
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
 * Lấy danh sách sản phẩm (Có phân trang)
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

		let resolvedShopId = null;
		if (shopId) {
			if (!mongoose.Types.ObjectId.isValid(shopId)) {
				throw new Error("shopId không hợp lệ");
			}
			resolvedShopId = new mongoose.Types.ObjectId(shopId);
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

		if (!includeInactive) {
			filter.isActive = true;
		}

		const pageNumber = parseInt(page) || 1;
		const limitNumber = parseInt(limit) || 10;
		const skip = (pageNumber - 1) * limitNumber;

		const [products, total] = await Promise.all([
			Product.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limitNumber)
				.select(
					"_id pdName basePrice images isActive shopId createdAt updatedAt"
				)
				.lean(),
			Product.countDocuments(filter),
		]);

		const totalPages = Math.ceil(total / limitNumber);

		return {
			success: true,
			message: "Lấy danh sách sản phẩm thành công",
			data: {
				products,
				pagination: {
					total,
					page: pageNumber,
					limit: limitNumber,
					totalPages,
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
 */
export const getProductDetail = async (productId) => {
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID sản phẩm không hợp lệ");

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

		const account = product.shopId?.accountId;

		const shopInfo = {
			_id: product.shopId._id,
			shopName: product.shopId.shopName,
			logoUrl: product.shopId.logoUrl,
			isOnline: account?.status === "active",
			lastActiveAt: account?.lastActive || null,
			lastActiveText: getLastActiveString(account),
			accountId: account?._id || null,
		};

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
		return {
			success: false,
			message: error.message || "Không thể lấy chi tiết sản phẩm",
		};
	}
};

/**
 * Tạo sản phẩm mới kèm biến thể
 */
export const createProductWithVariantsService = async (
	payload,
	tempFiles = []
) => {
	let createdProduct = null;
	let createdVariants = [];
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

		const shop = await Shop.findOne({ accountId }).select("_id").lean();
		if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");

		await withTransaction(async (session) => {
			const products = await Product.create(
				[
					{
						pdName,
						basePrice,
						description,
						images,
						shopId: shop._id,
						isActive: true,
					},
				],
				{ session }
			);
			createdProduct = products[0];

			await ProductAIConfig.create(
				[{ productId: createdProduct._id, targetGroup }],
				{ session }
			);

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

		// Đồng bộ AI cho Img2Img
		if (createdProduct && createdProduct.images?.length > 0) {
			indexImagesInBackground(
				createdProduct._id,
				createdProduct.images,
				targetGroup
			);
		}

		// Đồng bộ AI cho Txt2Img
		const allImagePaths = [
			...(createdProduct?.images || []),
			...createdVariants.map((v) => v.image).filter(Boolean),
		];
		if (createdProduct && allImagePaths.length > 0) {
			syncEmbeddings(createdProduct._id, allImagePaths);
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

// 🔽 KHÔI PHỤC HÀM NÀY 🔽
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
 */
export const updateProductImagesService = async (productId, newImages = []) => {
	const backups = [];
	const tempFilesToDelete = [];
	try {
		if (!mongoose.Types.ObjectId.isValid(productId))
			throw new Error("ID không hợp lệ");
		if (!Array.isArray(newImages))
			throw new Error("Danh sách ảnh không hợp lệ");

		const product = await Product.findById(productId);
		if (!product) throw new Error("Không tìm thấy sản phẩm");

		const oldImages = product.images || [];
		const imagesToRemove = oldImages.filter((img) => !newImages.includes(img));
		const imagesToAdd = newImages.filter((img) => !oldImages.includes(img));

		// Backup ảnh cũ
		for (const old of imagesToRemove) {
			const filePath = path.join(PRODUCT_FOLDER, path.basename(old));
			if (fs.existsSync(filePath)) {
				const backup = backupFile(filePath);
				if (backup) backups.push({ original: filePath, backup });
			}
		}

		// Xóa ảnh cũ khỏi Img2Img AI
		const img2imgFilenamesToDelete = imagesToRemove.map((p) =>
			path.basename(p)
		);
		if (img2imgFilenamesToDelete.length > 0) {
			(async () => {
				try {
					const form = new FormData();
					form.append("product_id", productId.toString());
					form.append("image_ids", JSON.stringify(img2imgFilenamesToDelete));
					await axios.post(`${MODEL_API_URL}/delete-batch`, form, {
						headers: form.getHeaders(),
					});
					console.log(
						`[AI Img2Img] Deleted batch: ${img2imgFilenamesToDelete.length} images`
					);
				} catch (e) {
					console.error("[AI Img2Img] Delete Batch Error:", e.message);
				}
			})();
		}

		// Cập nhật DB
		product.images = newImages;
		await product.save();

		// Xóa file vật lý cũ
		for (const b of backups) {
			if (fs.existsSync(b.original)) fs.unlinkSync(b.original);
			removeBackup(b.backup);
		}

		// Thêm ảnh mới vào Img2Img AI
		if (imagesToAdd.length > 0) {
			let aiConfig = await ProductAIConfig.findOne({ productId });
			if (!aiConfig) {
				aiConfig = await ProductAIConfig.create({
					productId,
					targetGroup: "full_body",
				});
			}
			indexImagesInBackground(productId, imagesToAdd, aiConfig.targetGroup);
		}

		// Đồng bộ Txt2Img AI
		if (imagesToAdd.length > 0) {
			syncEmbeddings(productId, imagesToAdd);
		}
		if (imagesToRemove.length > 0) {
			removeEmbeddings(productId, imagesToRemove);
		}

		return {
			success: true,
			message: "Cập nhật ảnh thành công",
			data: product.toObject(),
		};
	} catch (error) {
		for (const img of newImages) {
			if (!oldImages.includes(img)) {
				tempFilesToDelete.push(path.join(PRODUCT_FOLDER, path.basename(img)));
			}
		}
		rollbackFiles(tempFilesToDelete);
		for (const b of backups) restoreFile(b.backup, b.original);

		return { success: false, message: error.message };
	}
};

/**
 * Cập nhật thông tin cơ bản của sản phẩm
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

		if (updateData.basePrice != null) {
			if (isNaN(updateData.basePrice) || updateData.basePrice < 0)
				throw new Error("Giá không hợp lệ");
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
		return { success: false, message: error.message };
	}
};

/**
 * Chuyển đổi trạng thái hiển thị của sản phẩm
 */
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
 * Xóa sản phẩm và các biến thể liên quan
 */
export const deleteProductWithVariantsService = async (productId) => {
	let allImages = [];
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

			allImages = [
				...(product.images || []),
				...variants.map((v) => v.image).filter(Boolean),
			];

			for (const img of allImages) {
				const filePath = path.join(PRODUCT_FOLDER, path.basename(img));
				if (fs.existsSync(filePath)) {
					const backup = backupFile(filePath);
					if (backup) backups.push({ original: filePath, backup });
					fs.unlinkSync(filePath);
				}
			}

			await ProductVariant.deleteMany({ productId }).session(session);
			await Product.findByIdAndDelete(productId).session(session);
		});

		for (const b of backups) removeBackup(b.backup);

		// Xóa khỏi Img2Img AI
		(async () => {
			try {
				const pid = productId.toString();
				const form = new FormData();
				form.append("product_id", pid);
				await axios.delete(`${MODEL_API_URL}/delete-product`, {
					data: form,
					headers: form.getHeaders(),
				});
				console.log(`[Img2Img] Deleted vector: ${pid}`);
			} catch (e) {
				console.error("[Img2Img] Delete error:", e.message);
			}
		})();

		// Xóa khỏi Txt2Img AI
		if (allImages.length > 0) {
			removeEmbeddings(productId, allImages);
		}

		return { success: true, message: "Đã xóa sản phẩm và biến thể liên quan" };
	} catch (error) {
		for (const b of backups) restoreFile(b.backup, b.original);
		return { success: false, message: error.message };
	}
};

/**
 * Đếm số lượng sản phẩm
 */
export const countProductsService = async ({
	shopId,
	accountId,
	includeInactive = false,
}) => {
	try {
		let finalShopId = shopId;

		if (!finalShopId && accountId) {
			const shop = await Shop.findOne({ accountId }).select("_id");
			if (!shop) throw new Error("Không tìm thấy cửa hàng của tài khoản này.");
			finalShopId = shop._id;
		}

		const filter = {};
		if (finalShopId) filter.shopId = finalShopId;
		if (!includeInactive) filter.isActive = true;

		const total = await Product.countDocuments(filter);

		return {
			success: true,
			message: `Tổng số sản phẩm: ${total}`,
			data: { total },
		};
	} catch (error) {
		return { success: false, message: error.message, data: { total: 0 } };
	}
};

/**
 * Tìm kiếm sản phẩm (cho admin hoặc shop)
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
		const safePage = Math.max(1, parseInt(page) || 1);
		const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
		const skip = (safePage - 1) * safeLimit;

		const priceFilter = {};
		if (priceRange) {
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
		}

		if (isAdmin) {
			const match = {};
			if (status === "active") match.isActive = true;
			else if (status === "inactive") match.isActive = false;
			if (Object.keys(priceFilter).length) match.basePrice = priceFilter;

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

			const [products, totalResult] = await Promise.all([
				Product.aggregate([
					...pipeline,
					{ $sort: { createdAt: -1 } },
					{ $skip: skip },
					{ $limit: safeLimit },
				]),
				Product.aggregate([...pipeline, { $count: "total" }]),
			]);

			const total = totalResult[0]?.total || 0;
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
		} else {
			// Shop mode
			if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
				throw new Error("accountId không hợp lệ cho chế độ shop");
			}
			const shop = await Shop.findOne({ accountId }).select("_id").lean();
			if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");

			const filter = { shopId: shop._id };
			if (query?.trim())
				filter.pdName = { $regex: query.trim(), $options: "i" };
			if (status === "active") filter.isActive = true;
			else if (status === "inactive") filter.isActive = false;
			if (Object.keys(priceFilter).length) filter.basePrice = priceFilter;

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

//========== ADMIN SERVICES ==========

const isFileExist = (imagePath) => {
	if (!imagePath) return false;
	const relativePath = imagePath.startsWith("/")
		? imagePath.slice(1)
		: imagePath;
	const absolutePath = path.join(process.cwd(), relativePath);
	return fs.existsSync(absolutePath);
};

/**
 * ADMIN: Re-index toàn bộ sản phẩm cho Img2Img
 */
export const reindexAllProductsService = async () => {
	console.log("🚀 Bắt đầu Re-index toàn bộ sản phẩm (Img2Img)...");

	const products = await Product.find({ isActive: true }).lean();
	let count = 0;

	for (const product of products) {
		const pid = product._id;
		const aiConfig = await ProductAIConfig.findOne({ productId: pid }).lean();
		const targetGroup = aiConfig?.targetGroup || "full_body";

		let imagesToIndex = [];
		if (product.images && product.images.length > 0) {
			imagesToIndex.push(...product.images.filter(isFileExist));
		}

		const variants = await ProductVariant.find({ productId: pid }).lean();
		for (const variant of variants) {
			if (variant.image && isFileExist(variant.image)) {
				imagesToIndex.push(variant.image);
			}
		}

		if (imagesToIndex.length > 0) {
			indexImagesInBackground(pid, imagesToIndex, targetGroup);
			count += imagesToIndex.length;
		}
	}

	console.log(
		`✅ Re-index (Img2Img) hoàn tất! Đã gửi ${count} ảnh sang AI để xử lý.`
	);
	return { message: `Đã gửi ${count} ảnh sang AI (Img2Img) để xử lý.` };
};

/**
 * ADMIN: Re-index toàn bộ sản phẩm cho Text Search
 */
export const reindexTextSearchService = async () => {
	console.log("🚀 Bắt đầu Re-index Text Search...");

	const AI_API_BASE_URL = process.env.AI_API_URL || "http://localhost:8000";

	try {
		console.log("🧹 Đang yêu cầu AI xóa dữ liệu cũ...");
		await axios.post(`${AI_API_BASE_URL}/txt2img/clear`);
		console.log("✨ Đã reset Index thành công. Bắt đầu gửi dữ liệu mới...");
	} catch (error) {
		console.error("❌ Lỗi khi reset AI Index:", error.message);
		return { message: "Không thể kết nối tới AI Server để reset dữ liệu." };
	}

	const products = await Product.find({ isActive: true })
		.select("_id images")
		.lean();
	let count = 0;

	for (const product of products) {
		const pid = product._id.toString();
		let imagesToIndex = [];

		if (product.images && product.images.length > 0) {
			imagesToIndex.push(...product.images);
		}

		const variants = await ProductVariant.find({ productId: pid })
			.select("image")
			.lean();
		for (const variant of variants) {
			if (variant.image) {
				imagesToIndex.push(variant.image);
			}
		}

		const validImages = imagesToIndex.filter(isFileExist);
		if (validImages.length > 0) {
			syncEmbeddings(pid, validImages);
			count += validImages.length;
		}
	}

	console.log(`✅ Re-index Text Search hoàn tất! Đã gửi ${count} ảnh.`);
	return {
		totalProcessed: count,
		message: `Đã gửi ${count} ảnh sang hệ thống Text Search để xử lý.`,
	};
};

// import mongoose from "mongoose";
// import ProductVariant from "./productVariant.model.js";
// import Product from "./product.model.js";
// import ProductAIConfig from "./productAIConfig.model.js";
// import { getLastActiveString } from "../../utils/index.js";
// // import Attribute from "./attribute.model.js";
// // import AttributeValue from "./attributeValue.model.js";
// import { createProductVariantsBulk } from "./productVariant.service.js";
// import Shop from "../shop/shop.model.js";
// import fs from "fs";
// import path from "path";
// import axios from "axios";
// import FormData from "form-data";
// import {
// 	rollbackFiles,
// 	backupFile,
// 	restoreFile,
// 	removeBackup,
// 	withTransaction,
// 	toObjectId,
// } from "../../utils/index.js";
// import { syncToAI, syncToTextAI } from "../../utils/ai-sync.util.js";

// const MODEL_API_URL = "http://localhost:8000/img2img";
// const TEXT_MODEL_API_URL = "http://localhost:8000/txt2img";

// const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
// export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
// export const PRODUCTS_PUBLIC = "/uploads/products";

// // -------------------HELPER SERVICES -------------------
// /**
//  * Hàm chạy ngầm gửi ảnh sang AI Model để Index
//  */
// const indexImagesInBackground = async (productId, imagePaths, targetGroup) => {
// 	if (!imagePaths || imagePaths.length === 0) return;

// 	// Chạy async background
// 	(async () => {
// 		for (const imgRelPath of imagePaths) {
// 			try {
// 				// 1. Lấy tên file chuẩn (bỏ phần /uploads/products/ đi)
// 				const fileName = path.basename(imgRelPath);

// 				// 2. Tạo đường dẫn tuyệt đối trên ổ cứng
// 				// Đảm bảo PRODUCT_FOLDER đã được define đúng như bước 1
// 				const absolutePath = path.join(PRODUCT_FOLDER, fileName);

// 				// 3. Kiểm tra file có tồn tại không trước khi gửi
// 				if (fs.existsSync(absolutePath)) {
// 					const form = new FormData();
// 					form.append("product_id", productId.toString());

// 					// Quan trọng: image_id phải là tên file để sau này tìm xóa cho dễ
// 					form.append("image_id", fileName);

// 					form.append("group", targetGroup);

// 					// Tạo stream đọc file
// 					form.append("file", fs.createReadStream(absolutePath));

// 					// Gửi sang Python API
// 					await axios.post(`${MODEL_API_URL}/index`, form, {
// 						headers: form.getHeaders(),
// 					});

// 					console.log(`[AI] Indexed Success: ${fileName}`);
// 				} else {
// 					console.warn(`[AI] File not found on disk: ${absolutePath}`);
// 				}
// 			} catch (err) {
// 				// Log lỗi chi tiết nhưng không làm crash server
// 				console.error(
// 					`[AI] Index Failed [${path.basename(imgRelPath)}]:`,
// 					err.message
// 				);
// 			}
// 		}
// 	})();
// };
// //--------------------------------------------------------------------------------------

// /**
//  * Lấy danh sách sản phẩm
//  * @param {Object} options
//  * @param {String|ObjectId} [options.shopId] - Lọc sản phẩm theo shopId (nếu có)
//  * @param {String|ObjectId} [options.accountId] - Nếu không có shopId, có thể truyền accountId để xác định shop
//  * @param {Boolean} [options.includeInactive=false] - true => lấy cả sản phẩm ẩn; false => chỉ lấy isActive=true
//  * @returns {Object} { success, message, data }
//  */
// // export const getAllProducts = async ({
// // 	shopId,
// // 	accountId,
// // 	includeInactive = false,
// // }) => {
// // 	try {
// // 		const filter = {};

// // 		// --- Xác định shopId ---
// // 		let resolvedShopId = null;

// // 		if (shopId) {
// // 			if (!mongoose.Types.ObjectId.isValid(shopId)) {
// // 				throw new Error("shopId không hợp lệ");
// // 			}
// // 			resolvedShopId = mongoose.Types.ObjectId(shopId);
// // 		} else if (accountId) {
// // 			// Nếu không truyền shopId, dùng accountId để tra ra shop
// // 			if (!mongoose.Types.ObjectId.isValid(accountId)) {
// // 				throw new Error("accountId không hợp lệ");
// // 			}

// // 			const shop = await Shop.findOne({ accountId }).select("_id").lean();
// // 			if (!shop) {
// // 				throw new Error("Không tìm thấy shop tương ứng với accountId này");
// // 			}
// // 			resolvedShopId = shop._id;
// // 		}

// // 		if (resolvedShopId) {
// // 			filter.shopId = resolvedShopId;
// // 		}

// // 		// --- Lọc theo trạng thái hoạt động ---
// // 		if (!includeInactive) {
// // 			filter.isActive = true;
// // 		}

// // 		// --- Truy vấn dữ liệu ---
// // 		const products = await Product.find(filter)
// // 			.sort({ createdAt: -1 }) // mới nhất lên trước
// // 			.select("_id pdName basePrice images isActive shopId createdAt updatedAt") // chọn cột cần thiết
// // 			.lean();

// // 		return {
// // 			success: true,
// // 			message: "Lấy danh sách sản phẩm thành công",
// // 			data: products,
// // 		};
// // 	} catch (error) {
// // 		return {
// // 			success: false,
// // 			message: error.message || "Lỗi khi lấy danh sách sản phẩm",
// // 			data: [],
// // 		};
// // 	}
// // };
// /**
//  * Lấy danh sách sản phẩm (Có phân trang)
//  * @param {Object} options
//  * @param {String|ObjectId} [options.shopId]
//  * @param {String|ObjectId} [options.accountId]
//  * @param {Boolean} [options.includeInactive=false]
//  * @param {Number} [options.page=1] - Trang hiện tại
//  * @param {Number} [options.limit=10] - Số lượng item mỗi trang
//  * @returns {Object} { success, message, data: { products, pagination } }
//  */
// export const getAllProducts = async ({
// 	shopId,
// 	accountId,
// 	includeInactive = false,
// 	page = 1,
// 	limit = 10,
// }) => {
// 	try {
// 		const filter = {};

// 		// --- 1. Xử lý logic ShopId (Giữ nguyên) ---
// 		let resolvedShopId = null;
// 		if (shopId) {
// 			if (!mongoose.Types.ObjectId.isValid(shopId)) {
// 				throw new Error("shopId không hợp lệ");
// 			}
// 			resolvedShopId = new mongoose.Types.ObjectId(shopId); // Thêm new cho chuẩn Mongoose mới
// 		} else if (accountId) {
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

// 		// --- 2. Lọc theo trạng thái ---
// 		if (!includeInactive) {
// 			filter.isActive = true;
// 		}

// 		// --- 3. Xử lý Phân trang ---
// 		const pageNumber = parseInt(page) || 1;
// 		const limitNumber = parseInt(limit) || 10;
// 		const skip = (pageNumber - 1) * limitNumber;

// 		// --- 4. Truy vấn song song (Lấy data + Đếm tổng) ---
// 		const [products, total] = await Promise.all([
// 			Product.find(filter)
// 				.sort({ createdAt: -1 })
// 				.skip(skip) // Bỏ qua số lượng item của các trang trước
// 				.limit(limitNumber) // Chỉ lấy số lượng limit
// 				.select(
// 					"_id pdName basePrice images isActive shopId createdAt updatedAt"
// 				)
// 				.lean(),
// 			Product.countDocuments(filter), // Đếm tổng số lượng thỏa điều kiện
// 		]);

// 		const totalPages = Math.ceil(total / limitNumber);

// 		return {
// 			success: true,
// 			message: "Lấy danh sách sản phẩm thành công",
// 			data: {
// 				products, // Mảng sản phẩm
// 				pagination: {
// 					total, // Tổng số sản phẩm
// 					page: pageNumber, // Trang hiện tại
// 					limit: limitNumber, // Giới hạn mỗi trang
// 					totalPages, // Tổng số trang
// 				},
// 			},
// 		};
// 	} catch (error) {
// 		console.error("Get products error:", error);
// 		return {
// 			success: false,
// 			message: error.message || "Lỗi khi lấy danh sách sản phẩm",
// 			data: {
// 				products: [],
// 				pagination: {
// 					total: 0,
// 					page: 1,
// 					limit: 10,
// 					totalPages: 0,
// 				},
// 			},
// 		};
// 	}
// };

// /**
//  * Lấy chi tiết 1 sản phẩm kèm toàn bộ biến thể
//  * @param {String} productId
//  */
// export const getProductDetail = async (productId) => {
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(productId))
// 			throw new Error("ID sản phẩm không hợp lệ");

// 		//  Lấy sản phẩm chính
// 		const product = await Product.findById(productId)
// 			.populate({
// 				path: "shopId",
// 				select: "shopName logoUrl accountId",
// 				populate: {
// 					path: "accountId",
// 					select: "status lastActive",
// 				},
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

// 		// ---- BỔ SUNG THÔNG TIN TRẠNG THÁI SHOP ----
// 		const account = product.shopId?.accountId;

// 		const shopInfo = {
// 			_id: product.shopId._id,
// 			shopName: product.shopId.shopName,
// 			logoUrl: product.shopId.logoUrl,

// 			// bổ sung trạng thái shop
// 			isOnline: account?.status === "active",
// 			lastActiveAt: account?.lastActive || null,
// 			lastActiveText: getLastActiveString(account),

// 			// nếu muốn giữ lại accountId gốc
// 			accountId: account?._id || null,
// 		};

// 		// ---- GHI ĐÈ shopId ĐỂ GOM LẠI ----
// 		product.shopId = shopInfo;

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
// // export const getProductDetail = async (productId) => {
// // 	try {
// // 		if (!mongoose.Types.ObjectId.isValid(productId))
// // 			throw new Error("ID sản phẩm không hợp lệ");

// // 		//  Lấy sản phẩm chính
// // 		const product = await Product.findById(productId)
// // 			.populate({
// // 				path: "shopId",
// // 				select: "shopName logoUrl",
// // 			})
// // 			.lean();
// // 		if (!product) throw new Error("Không tìm thấy sản phẩm");

// // 		// Lấy danh sách biến thể
// // 		const variants = await ProductVariant.find({ productId })
// // 			.populate({
// // 				path: "attributes.attributeId",
// // 				select: "label",
// // 			})
// // 			.populate({
// // 				path: "attributes.valueId",
// // 				select: "value",
// // 			})
// // 			.lean();

// // 		// Map lại để dễ đọc
// // 		const mappedVariants = variants.map((v) => ({
// // 			_id: v._id,
// // 			variantKey: v.variantKey,
// // 			stock: v.stock,
// // 			image: v.image,
// // 			priceAdjustment: v.priceAdjustment,
// // 			attributes: v.attributes.map((a) => ({
// // 				attributeId: a.attributeId?._id,
// // 				attributeLabel: a.attributeId?.label || null,
// // 				valueId: a.valueId?._id,
// // 				valueLabel: a.valueId?.value || null,
// // 			})),
// // 		}));

// // 		return {
// // 			success: true,
// // 			message: "Lấy chi tiết sản phẩm thành công",
// // 			data: {
// // 				...product,
// // 				variants: mappedVariants,
// // 			},
// // 		};
// // 	} catch (error) {
// // 		// console.error("Lỗi getProductDetail:", error);
// // 		return {
// // 			success: false,
// // 			message: error.message || "Không thể lấy chi tiết sản phẩm",
// // 		};
// // 	}
// // };

// /**
//  * Tạo sản phẩm mới kèm biến thể
//  *
//  * @param {Object} payload
//  *   {
//  *     pdName: String,
//  *     basePrice: Number,
//  *     description?: String,
//  *     images?: [String],          // danh sách ảnh sản phẩm
//  *     accountId: String|ObjectId, // để xác định shopId
//  *     variantsPayload?: Array     // nếu FE đã sinh tổ hợp biến thể
//  *   }
//  *
//  * @returns { success, message, data }  // data = { product, variants }
//  */
// export const createProductWithVariantsService = async (
// 	payload,
// 	tempFiles = []
// ) => {
// 	let createdProduct = null;
// 	let createdVariants = [];
// 	// Lấy targetGroup từ payload (FE gửi lên)
// 	const { targetGroup = "full_body" } = payload;
// 	try {
// 		const {
// 			pdName,
// 			basePrice,
// 			description = "",
// 			images = [],
// 			accountId,
// 			variantsPayload = [],
// 		} = payload;

// 		if (!pdName || typeof pdName !== "string")
// 			throw new Error("Thiếu tên sản phẩm hợp lệ");
// 		if (isNaN(basePrice) || basePrice < 0)
// 			throw new Error("Giá sản phẩm không hợp lệ");
// 		if (!accountId) throw new Error("Thiếu accountId để xác định shop");

// 		// --- Lấy shopId từ accountId ---
// 		const shop = await Shop.findOne({ accountId }).select("_id").lean();
// 		if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");

// 		// --- Transaction để tạo sản phẩm và các biến thể ---
// 		await withTransaction(async (session) => {
// 			// Tạo sản phẩm
// 			const products = await Product.create(
// 				[
// 					{
// 						pdName,
// 						basePrice,
// 						description,
// 						images,
// 						shopId: shop._id,
// 						isActive: true,
// 						createdAt: new Date(),
// 						updatedAt: new Date(),
// 					},
// 				],
// 				{ session }
// 			);

// 			createdProduct = products[0]; // vì insertMany trả về mảng

// 			// Tạo cấu hình AI cho sản phẩm này
// 			await ProductAIConfig.create(
// 				[
// 					{
// 						productId: createdProduct._id,
// 						targetGroup: targetGroup, // Giá trị FE chọn (upper/lower/full)
// 					},
// 				],
// 				{ session }
// 			);

// 			// Tạo biến thể nếu có variantsPayload
// 			if (variantsPayload?.length) {
// 				const result = await createProductVariantsBulk(
// 					createdProduct._id,
// 					accountId,
// 					variantsPayload,
// 					tempFiles,
// 					session
// 				);
// 				if (!result.success) throw new Error(result.message);
// 				createdVariants = result.data;
// 			}
// 		});
// 		// Gọi AI Index (Chạy ngầm sau khi Transaction commit thành công)
// 		if (createdProduct && createdProduct.images?.length > 0) {
// 			indexImagesInBackground(
// 				createdProduct._id,
// 				createdProduct.images,
// 				targetGroup
// 			);
// 		}

// 		// Gọi Text2Img Index (Chạy ngầm)
// 		(async () => {
// 			try {
// 				const pid = createdProduct._id.toString();

// 				// 1. Index ảnh chính của sản phẩm
// 				if (createdProduct.images?.length > 0) {
// 					for (const img of createdProduct.images) {
// 						// Hàm này tự check file tồn tại và gửi sang Python
// 						await syncToTextAI(pid, img);
// 					}
// 				}

// 				// 2. Index ảnh biến thể (nếu có)
// 				if (createdVariants?.length > 0) {
// 					for (const v of createdVariants) {
// 						if (v.image) {
// 							await syncToTextAI(pid, v.image);
// 						}
// 					}
// 				}
// 				console.log(`[Text2Img] Auto-indexed new product: ${pid}`);
// 			} catch (err) {
// 				console.error("[Text2Img] Auto-index failed:", err.message);
// 			}
// 		})();

// 		return {
// 			success: true,
// 			message: "Tạo sản phẩm thành công",
// 			data: { createdProduct, createdVariants },
// 		};
// 	} catch (error) {
// 		rollbackFiles(tempFiles);
// 		return { success: false, message: error.message };
// 	}
// };

// /**
//  * Xử lý tổng hợp ảnh cho mode "add"
//  * @param {String} productId - ID sản phẩm
//  * @param {Array<String>} keepImages - danh sách ảnh FE muốn giữ (có thể rỗng)
//  * @param {Array<String>} uploadedImages - danh sách ảnh upload mới
//  * @returns {Promise<Array<String>>} danh sách ảnh mới sau khi add
//  */
// export const handleAddModeImages = async (
// 	productId,
// 	keepImages = [],
// 	uploadedImages = []
// ) => {
// 	const product = await Product.findById(productId).lean();
// 	if (!product) throw new Error("Không tìm thấy sản phẩm");

// 	const existingImages = product.images || [];

// 	// nếu FE có keepImages → giữ keepImages, nếu không → giữ toàn bộ ảnh cũ
// 	const imagesToKeep = keepImages.length > 0 ? keepImages : existingImages;

// 	// tổng hợp ảnh cuối cùng
// 	return [...imagesToKeep, ...uploadedImages];
// };
// /**
//  * Cập nhật danh sách ảnh của sản phẩm (xóa ảnh cũ khỏi thư mục nếu có)
//  * @param {String} productId
//  * @param {Array<String>} images Danh sách ảnh mới
//  */
// export const updateProductImagesService = async (productId, newImages = []) => {
// 	const backups = [];
// 	const tempFilesToDelete = []; // ảnh mới upload nhưng rollback nếu lỗi
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(productId))
// 			throw new Error("ID không hợp lệ");
// 		if (!Array.isArray(newImages))
// 			throw new Error("Danh sách ảnh không hợp lệ");

// 		const product = await Product.findById(productId);
// 		if (!product) throw new Error("Không tìm thấy sản phẩm");

// 		const oldImages = product.images || [];

// 		// --- Backup và xác định ảnh cũ cần xóa ---
// 		const imagesToDeleteForAI = [];
// 		for (const old of oldImages) {
// 			if (!newImages.includes(old)) {
// 				const filePath = path.join(PRODUCT_FOLDER, path.basename(old));
// 				if (fs.existsSync(filePath)) {
// 					const backup = backupFile(filePath);
// 					if (backup) backups.push({ original: filePath, backup });
// 				}
// 				// Lấy tên file để gửi sang AI xóa
// 				imagesToDeleteForAI.push(path.basename(old));
// 			}
// 		}
// 		// --- 2. GỌI MODEL API ĐỂ XÓA BATCH (CODE MỚI) ---
// 		if (imagesToDeleteForAI.length > 0) {
// 			(async () => {
// 				try {
// 					const form = new FormData();
// 					form.append("product_id", productId.toString());
// 					form.append("image_ids", JSON.stringify(imagesToDeleteForAI));

// 					await axios.post(`${MODEL_API_URL}/delete-batch`, form, {
// 						headers: form.getHeaders(),
// 					});
// 					console.log(
// 						`[AI] Deleted batch: ${imagesToDeleteForAI.length} images`
// 					);
// 				} catch (e) {
// 					console.error("[AI] Delete Batch Error:", e.message);
// 				}
// 			})();
// 		}

// 		// --- Xác định file mới cần rollback nếu lỗi ---
// 		for (const img of newImages) {
// 			if (!oldImages.includes(img)) {
// 				tempFilesToDelete.push(path.join(PRODUCT_FOLDER, path.basename(img)));
// 			}
// 		}

// 		// --- Cập nhật DB ---
// 		product.images = newImages;
// 		await product.save();

// 		// --- Commit thành công → xóa file cũ không dùng ---
// 		for (const b of backups) {
// 			if (fs.existsSync(b.original)) fs.unlinkSync(b.original);
// 			removeBackup(b.backup);
// 		}

// 		// --- GỌI AI INDEX (ẢNH MỚI) ---
// 		const imagesToAddForAI = newImages.filter(
// 			(img) => !oldImages.includes(img)
// 		);

// 		if (imagesToAddForAI.length > 0) {
// 			// Lấy targetGroup từ DB
// 			let aiConfig = await ProductAIConfig.findOne({ productId });
// 			if (!aiConfig) {
// 				aiConfig = await ProductAIConfig.create({
// 					productId,
// 					targetGroup: "full_body",
// 				});
// 			}

// 			// Gọi index background
// 			indexImagesInBackground(
// 				productId,
// 				imagesToAddForAI,
// 				aiConfig.targetGroup
// 			);

// 			// Gọi Text2Img Index (Chạy ngầm)
// 			(async () => {
// 				try {
// 					for (const img of imagesToAddForAI) {
// 						await syncToTextAI(productId.toString(), img);
// 					}
// 					console.log(`[Text2Img] Updated index for product: ${productId}`);
// 				} catch (e) {
// 					console.error("[Text2Img] Update index error:", e.message);
// 				}
// 			})();
// 		}
// 		return {
// 			success: true,
// 			message: "Cập nhật ảnh thành công",
// 			data: product.toObject(),
// 		};
// 	} catch (error) {
// 		// --- Rollback file mới ---
// 		rollbackFiles(tempFilesToDelete);

// 		// --- Restore file cũ nếu backup ---
// 		for (const b of backups) restoreFile(b.backup, b.original);

// 		return { success: false, message: error.message };
// 	}
// };

// /**
//  * Cập nhật thông tin cơ bản của sản phẩm
//  * @param {String} productId
//  * @param {Object} updates { pdName?, basePrice?, description? }
//  */
// export const updateProductBasicInfoService = async (productId, updates) => {
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(productId))
// 			throw new Error("ID sản phẩm không hợp lệ");

// 		const allowedFields = ["pdName", "basePrice", "description"];
// 		const updateData = {};

// 		for (const key of allowedFields)
// 			if (updates[key] != null) updateData[key] = updates[key];

// 		if (!Object.keys(updateData).length)
// 			throw new Error("Không có dữ liệu để cập nhật");

// 		// Kiểm tra giá nếu có basePrice
// 		if (updateData.basePrice != null) {
// 			if (isNaN(updateData.basePrice)) throw new Error("Giá không hợp lệ");
// 			if (updateData.basePrice < 0)
// 				throw new Error("Giá phải lớn hơn hoặc bằng 0");
// 		}

// 		const product = await Product.findByIdAndUpdate(
// 			productId,
// 			{ $set: updateData },
// 			{ new: true }
// 		).lean();
// 		if (!product) throw new Error("Không tìm thấy sản phẩm");

// 		return {
// 			success: true,
// 			message: "Cập nhật sản phẩm thành công",
// 			data: product,
// 		};
// 	} catch (error) {
// 		// console.error("Lỗi updateProductBasicInfoService:", error);
// 		return { success: false, message: error.message };
// 	}
// };

// export const toggleProductActiveAutoService = async (productId) => {
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(productId))
// 			throw new Error("ID không hợp lệ");

// 		const product = await Product.findById(productId);
// 		if (!product) throw new Error("Không tìm thấy sản phẩm");

// 		product.isActive = !product.isActive;
// 		await product.save();

// 		return {
// 			success: true,
// 			message: product.isActive ? "Sản phẩm đã hiển thị" : "Sản phẩm đã bị ẩn",
// 			data: product,
// 		};
// 	} catch (error) {
// 		return { success: false, message: error.message };
// 	}
// };

// /**
//  * Helper: Gọi API xóa index ở cả 2 model AI (Chạy ngầm)
//  */
// const cleanupAIIndex = async (productId) => {
// 	const pid = productId.toString();

// 	// 1. Xóa bên Img2Img
// 	const deleteImg2Img = async () => {
// 		try {
// 			const form = new FormData();
// 			form.append("product_id", pid);
// 			await axios.delete(`${MODEL_API_URL}/delete-product`, {
// 				data: form,
// 				headers: form.getHeaders(),
// 			});
// 			console.log(`[Img2Img] Deleted vector: ${pid}`);
// 		} catch (e) {
// 			console.error("[Img2Img] Delete error:", e.message);
// 		}
// 	};

// 	// 2. Xóa bên Txt2Img
// 	const deleteTxt2Img = async () => {
// 		try {
// 			await axios.post(`${TEXT_MODEL_API_URL}/delete`, {
// 				product_id: pid,
// 			});
// 			console.log(`[Text2Img] Deleted vector: ${pid}`);
// 		} catch (e) {
// 			console.error("[Text2Img] Delete error:", e.message);
// 		}
// 	};

// 	// Chạy song song cả 2, không cái nào chặn cái nào
// 	await Promise.allSettled([deleteImg2Img(), deleteTxt2Img()]);
// };

// /**
//  * Xóa sản phẩm và các biến thể liên quan, rollback ảnh nếu lỗi
//  */
// export const deleteProductWithVariantsService = async (productId) => {
// 	const backups = [];
// 	try {
// 		if (!mongoose.Types.ObjectId.isValid(productId))
// 			throw new Error("ID không hợp lệ");

// 		// --- GIAI ĐOẠN 1: DATABASE & FILES (QUAN TRỌNG) ---
// 		await withTransaction(async (session) => {
// 			const product = await Product.findById(productId).session(session);
// 			if (!product) throw new Error("Không tìm thấy sản phẩm");

// 			const variants = await ProductVariant.find({ productId }).session(
// 				session
// 			);

// 			// Gom ảnh để backup/xóa
// 			const allImages = [
// 				...(product.images || []),
// 				...variants.map((v) => v.image).filter(Boolean),
// 			];

// 			// Backup ảnh
// 			for (const img of allImages) {
// 				const filePath = path.join(PRODUCT_FOLDER, path.basename(img));
// 				const backup = backupFile(filePath);
// 				if (backup) backups.push({ original: filePath, backup });

// 				if (fs.existsSync(filePath)) {
// 					fs.unlinkSync(filePath);
// 				}
// 			}

// 			// Xóa dữ liệu DB
// 			await ProductVariant.deleteMany({ productId }).session(session);
// 			await Product.findByIdAndDelete(productId).session(session);
// 		});

// 		// --- GIAI ĐOẠN 2: CLEANUP (KHÔNG QUAN TRỌNG) ---

// 		// 1. Xóa backup file (thành công thì xóa backup đi)
// 		for (const b of backups) removeBackup(b.backup);

// 		// 2. Gọi AI Cleanup (Fire-and-forget: Gọi mà không await để return ngay)
// 		cleanupAIIndex(productId).catch((err) =>
// 			console.error("Background AI cleanup error:", err)
// 		);

// 		return { success: true, message: "Đã xóa sản phẩm và biến thể liên quan" };
// 	} catch (error) {
// 		// Nếu lỗi Transaction -> Rollback file từ backup
// 		for (const b of backups) restoreFile(b.backup, b.original);
// 		return { success: false, message: error.message };
// 	}
// };

// /**
//  * Thống kê số lượng sản phẩm
//  * @param {Object} options
//  * @param {String|ObjectId} [options.shopId] - ID cửa hàng
//  * @param {String|ObjectId} [options.accountId] - ID tài khoản (nếu cần suy ra shop)
//  * @param {Boolean} [options.includeInactive=false] - true => lấy cả sản phẩm ẩn
//  * @returns {Object} { success, message, total }
//  */
// export const countProductsService = async ({
// 	shopId,
// 	accountId,
// 	includeInactive = false,
// }) => {
// 	try {
// 		let finalShopId = shopId;

// 		// Nếu không có shopId mà có accountId → tìm shop theo account
// 		if (!finalShopId && accountId) {
// 			const shop = await Shop.findOne({ accountId }).select("_id");
// 			if (!shop) throw new Error("Không tìm thấy cửa hàng của tài khoản này.");
// 			finalShopId = shop._id;
// 		}

// 		// Xây filter
// 		const filter = {};
// 		if (finalShopId) filter.shopId = finalShopId;
// 		if (!includeInactive) filter.isActive = true;

// 		// Đếm số lượng sản phẩm
// 		const total = await Product.countDocuments(filter);

// 		return {
// 			success: true,
// 			message: finalShopId
// 				? `Tổng số sản phẩm của cửa hàng: ${total}`
// 				: `Tổng số sản phẩm toàn hệ thống: ${total}`,
// 			data: {
// 				total: total,
// 			},
// 		};
// 	} catch (error) {
// 		return { success: false, message: error.message, total: 0 };
// 	}
// };

// /**
//  * Search products cho admin hoặc shop
//  * @param {Object} options
//  * @param {Boolean} options.isAdmin - true nếu admin, false nếu shop
//  * @param {String} [options.accountId] - cần nếu isAdmin=false
//  * @param {String} [options.query] - tìm theo tên sản phẩm
//  * @param {String} [options.shopName] - chỉ admin: tìm theo tên shop
//  * @param {String} [options.status] - "active" | "inactive" | "all"
//  * @param {String} [options.priceRange] - "<100", "100-300", "300-500", "500-1000", "1000<"
//  * @param {Number} [options.page=1]
//  * @param {Number} [options.limit=20]
//  */
// export const searchProducts = async ({
// 	isAdmin,
// 	accountId,
// 	query,
// 	status = "all",
// 	priceRange,
// 	page = 1,
// 	limit = 20,
// }) => {
// 	try {
// 		// --- Phân trang ---
// 		const safePage = Math.max(1, parseInt(page) || 1);
// 		const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100);
// 		const skip = (safePage - 1) * safeLimit;

// 		if (isAdmin) {
// 			// --- Admin: dùng aggregate để join shop ---
// 			const match = {};

// 			if (status === "active") match.isActive = true;
// 			else if (status === "inactive") match.isActive = false;

// 			if (priceRange) {
// 				const priceFilter = {};
// 				switch (priceRange) {
// 					case "<100":
// 						priceFilter.$lt = 100000;
// 						break;
// 					case "100-300":
// 						priceFilter.$gte = 100000;
// 						priceFilter.$lte = 300000;
// 						break;
// 					case "300-500":
// 						priceFilter.$gte = 300000;
// 						priceFilter.$lte = 500000;
// 						break;
// 					case "500-1000":
// 						priceFilter.$gte = 500000;
// 						priceFilter.$lte = 1000000;
// 						break;
// 					case "1000<":
// 						priceFilter.$gte = 1000000;
// 						break;
// 				}
// 				match.basePrice = priceFilter;
// 			}

// 			const pipeline = [
// 				{ $match: match },
// 				{
// 					$lookup: {
// 						from: "shops",
// 						localField: "shopId",
// 						foreignField: "_id",
// 						as: "shop",
// 					},
// 				},
// 				{ $unwind: "$shop" },
// 			];

// 			const q = query?.trim();
// 			if (q) {
// 				// chỉ push $match nếu q không rỗng
// 				pipeline.push({
// 					$match: {
// 						$or: [
// 							{ pdName: { $regex: q, $options: "i" } },
// 							{ description: { $regex: q, $options: "i" } },
// 							{ "shop.shopName": { $regex: q, $options: "i" } },
// 						],
// 					},
// 				});
// 			}

// 			pipeline.push({ $sort: { createdAt: -1 } });
// 			pipeline.push({ $skip: skip }, { $limit: safeLimit });

// 			const products = await Product.aggregate(pipeline);

// 			// Tính total
// 			const totalAgg = await Product.aggregate([
// 				{ $match: match },
// 				{
// 					$lookup: {
// 						from: "shops",
// 						localField: "shopId",
// 						foreignField: "_id",
// 						as: "shop",
// 					},
// 				},
// 				{ $unwind: "$shop" },
// 				...(q
// 					? [
// 							{
// 								$match: {
// 									$or: [
// 										{ pdName: { $regex: q, $options: "i" } },
// 										{ description: { $regex: q, $options: "i" } },
// 										{ "shop.shopName": { $regex: q, $options: "i" } },
// 									],
// 								},
// 							},
// 					  ]
// 					: []),
// 				{ $count: "total" },
// 			]);
// 			const totalCount = totalAgg[0]?.total || 0;

// 			return {
// 				success: true,
// 				message: "Lấy danh sách sản phẩm thành công",
// 				data: {
// 					products,
// 					total: totalCount,
// 					page: safePage,
// 					limit: safeLimit,
// 					totalPages: Math.ceil(totalCount / safeLimit),
// 				},
// 			};
// 		} else {
// 			// --- Shop mode: filter theo shopId ---
// 			if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
// 				throw new Error("accountId không hợp lệ cho chế độ shop");
// 			}

// 			// Lấy shopId từ accountId
// 			const shop = await Shop.findOne({ accountId }).select("_id").lean();
// 			if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");
// 			const shopId = shop._id;

// 			const filter = { shopId: new mongoose.Types.ObjectId(shopId) };

// 			const q = query?.trim();
// 			if (q) filter.pdName = { $regex: q, $options: "i" };

// 			if (status === "active") filter.isActive = true;
// 			else if (status === "inactive") filter.isActive = false;

// 			if (priceRange) {
// 				const priceFilter = {};
// 				switch (priceRange) {
// 					case "<100":
// 						priceFilter.$lt = 100000;
// 						break;
// 					case "100-300":
// 						priceFilter.$gte = 100000;
// 						priceFilter.$lte = 300000;
// 						break;
// 					case "300-500":
// 						priceFilter.$gte = 300000;
// 						priceFilter.$lte = 500000;
// 						break;
// 					case "500-1000":
// 						priceFilter.$gte = 500000;
// 						priceFilter.$lte = 1000000;
// 						break;
// 					case "1000<":
// 						priceFilter.$gte = 1000000;
// 						break;
// 				}
// 				filter.basePrice = priceFilter;
// 			}
// 			const [products, total] = await Promise.all([
// 				Product.find(filter)
// 					.sort({ createdAt: -1 })
// 					.skip(skip)
// 					.limit(safeLimit)
// 					.lean(),
// 				Product.countDocuments(filter),
// 			]);

// 			return {
// 				success: true,
// 				message: "Lấy danh sách sản phẩm thành công",
// 				data: {
// 					products,
// 					total,
// 					page: safePage,
// 					limit: safeLimit,
// 					totalPages: Math.ceil(total / safeLimit),
// 				},
// 			};
// 		}
// 	} catch (error) {
// 		console.error("searchProducts error:", error);
// 		return {
// 			success: false,
// 			message: error.message || "Lỗi khi tìm kiếm sản phẩm",
// 			data: { products: [], total: 0, page: 1, limit: 20, totalPages: 1 },
// 		};
// 	}
// };

// //========== ADMIN SEARCH SERVICES ==========

// /**
//  * Hàm helper để kiểm tra file có tồn tại không
//  */
// const isFileExist = (imagePath) => {
// 	if (!imagePath) return false;
// 	// Xóa dấu '/' ở đầu nếu có để path.join hoạt động đúng từ root
// 	const relativePath = imagePath.startsWith("/")
// 		? imagePath.slice(1)
// 		: imagePath;
// 	const absolutePath = path.join(process.cwd(), relativePath);
// 	return fs.existsSync(absolutePath);
// };

// /**
//  * ADMIN: Quét toàn bộ DB và gửi sang AI để embedding lại
//  */
// export const reindexAllProductsService = async () => {
// 	console.log("🚀 Bắt đầu Re-index toàn bộ sản phẩm...");

// 	const products = await Product.find({ isActive: true }).lean();
// 	let count = 0;

// 	for (const product of products) {
// 		const pid = product._id.toString();

// 		// 1. Index ảnh chính của Product (thường là mảng images)
// 		if (product.images && product.images.length > 0) {
// 			for (const img of product.images) {
// 				if (isFileExist(img)) {
// 					await syncToAI(pid, img);
// 					count++;
// 				} else {
// 					console.warn(`⚠️ Bỏ qua ảnh lỗi (Product): ${img}`);
// 				}
// 			}
// 		}

// 		// 2. Index ảnh của Variant (nếu có ảnh riêng)
// 		const variants = await ProductVariant.find({ productId: pid }).lean();
// 		for (const variant of variants) {
// 			if (variant.image) {
// 				if (isFileExist(variant.image)) {
// 					await syncToAI(pid, variant.image);
// 					count++;
// 				} else {
// 					console.warn(`⚠️ Bỏ qua ảnh lỗi (Variant): ${variant.image}`);
// 				}
// 			}
// 		}
// 	}

// 	console.log(`✅ Re-index hoàn tất! Tổng cộng ${count} ảnh đã được xử lý.`);
// 	return { message: `Đã gửi ${count} ảnh sang AI để xử lý.` };
// };

// /**
//  * ADMIN: Re-index chỉ cho Text Search (Không đụng hàng đồng nghiệp)
//  */
// export const reindexTextSearchService = async () => {
// 	console.log("🚀 Bắt đầu Re-index Text Search...");

// 	try {
// 		console.log("🧹 Đang yêu cầu AI xóa dữ liệu cũ...");
// 		await axios.post(`${TEXT_MODEL_API_URL}/clear`);
// 		console.log("✨ Đã reset Index thành công. Bắt đầu gửi dữ liệu mới...");
// 	} catch (error) {
// 		console.error("❌ Lỗi khi reset AI Index:", error.message);
// 		return { message: "Không thể kết nối tới AI Server để reset dữ liệu." };
// 	}
// 	// 1. Lấy tất cả sản phẩm đang hoạt động
// 	const products = await Product.find({ isActive: true })
// 		.select("_id images")
// 		.lean();
// 	let count = 0;

// 	for (const product of products) {
// 		const pid = product._id.toString();

// 		// A. Index ảnh chính của Product
// 		if (product.images && product.images.length > 0) {
// 			// Thường chỉ cần index ảnh đầu tiên (thumbnail) là đủ cho text search
// 			// Nhưng nếu muốn kỹ thì loop hết
// 			for (const img of product.images) {
// 				if (isFileExist(img)) {
// 					await syncToTextAI(pid, img);
// 					count++;
// 				} else {
// 					console.warn(`⚠️ Bỏ qua ảnh lỗi (Product): ${img}`);
// 				}
// 			}
// 		}

// 		// B. Index ảnh của Biến thể (Variant)
// 		// Vì biến thể có màu sắc khác nhau (VD: Áo đỏ, Áo xanh) nên cần index hết
// 		const variants = await ProductVariant.find({ productId: pid })
// 			.select("image")
// 			.lean();
// 		for (const variant of variants) {
// 			if (variant.image) {
// 				if (isFileExist(variant.image)) {
// 					await syncToTextAI(pid, variant.image);
// 					count++;
// 				} else {
// 					console.warn(`⚠️ Bỏ qua ảnh lỗi (Variant): ${variant.image}`);
// 				}
// 			}
// 		}
// 	}

// 	console.log(`✅ Re-index Text Search hoàn tất! Đã gửi ${count} ảnh.`);
// 	return {
// 		totalProcessed: count,
// 		message: `Đã gửi ${count} ảnh sang hệ thống Text Search để xử lý.`,
// 	};
// };
