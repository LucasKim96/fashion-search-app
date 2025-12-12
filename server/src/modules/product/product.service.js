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
			await ProductAIConfig.deleteOne({ productId }).session(session);
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
