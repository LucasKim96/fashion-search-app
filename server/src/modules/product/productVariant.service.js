// server/src/modules/product/productVariant.service.js
import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import Shop from "../shop/shop.model.js";
import path from "path";
import fs from "fs";
import {
	rollbackFiles,
	backupFile,
	restoreFile,
	removeBackup,
	withTransaction,
	toObjectId,
	generateVariantsCombinations,
} from "../../utils/index.js";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
export const PRODUCTS_PUBLIC = "/uploads/products";

// Sinh tất cả tổ hợp biến thể (không kiểm tra DB, không cần productId)
export const generateVariantCombinations = async (attributes) => {
	try {
		if (!Array.isArray(attributes) || attributes.length === 0) {
			return {
				success: false,
				message: "Danh sách thuộc tính không hợp lệ!",
			};
		}

		// Gọi utils sinh tổ hợp
		const combinations = generateVariantsCombinations(attributes);

		return {
			success: true,
			message: "Sinh tổ hợp biến thể thành công",
			data: combinations.map((c) => ({
				attributes: c.attributes, // [{ attributeId, valueId }]
				variantKey: c.variantKey, // ví dụ: "1|2"
			})),
		};
	} catch (error) {
		return {
			success: false,
			message: error.message || "Lỗi khi sinh tổ hợp biến thể",
		};
	}
};

// Sinh tổ hợp biến thể mới (chưa có trong DB dùng cho việc thêm sp biến thể)
export const generateNewVariantCombinations = async (productId, attributes) => {
	try {
		if (!productId) throw new Error("Thiếu productId");
		if (!Array.isArray(attributes) || attributes.length === 0)
			throw new Error("Danh sách thuộc tính không hợp lệ");

		const product = await Product.findById(productId);
		if (!product) throw new Error("Không tìm thấy sản phẩm"); // Lấy danh sách variantKey đã tồn tại trong DB (đã lưu cho sản phẩm này)

		const existingKeys = await ProductVariant.find({ productId }).distinct(
			"variantKey"
		);
		// Sinh tất cả các tổ hợp từ danh sách attribute & value người dùng chọn
		const allCombinations = generateVariantsCombinations(attributes);

		// Giữ lại những tổ hợp chưa có trong DB
		const availableCombinations = allCombinations.filter(
			(combo) => !existingKeys.includes(combo.variantKey)
		);

		return {
			success: true,
			message: "Sinh tổ hợp biến thể mới thành công",
			data: availableCombinations.map((c) => ({
				attributes: c.attributes, // [{ attributeId, valueId }]
				variantKey: c.variantKey, // ví dụ "1|2"
			})),
		};
	} catch (error) {
		// console.error("generateNewVariantCombinations error:", error);
		return {
			success: false,
			message: error.message || "Lỗi khi sinh tổ hợp biến thể mới",
			data: [],
		};
	}
};

//Lấy danh sách attribute + value (có đánh dấu isUsed) cho 1 sản phẩm (dùng cho việc thêm sp biến thể)
export const getProductAttributesWithValues = async (productId, accountId) => {
	try {
		if (!productId) throw new Error("Thiếu productId");
		if (!accountId) throw new Error("Thiếu accountId của shop");

		// Lấy shopId tương ứng với accountId
		const shop = await Shop.findOne({ accountId }).select("_id").lean();
		if (!shop)
			throw new Error("Không tìm thấy shop tương ứng với tài khoản này");
		const shopId = shop._id;

		//Kiểm tra sản phẩm có tồn tại không
		const product = await Product.findById(productId).lean();
		if (!product) throw new Error("Không tìm thấy sản phẩm");

		// Lấy tất cả các biến thể hiện có
		const variants = await ProductVariant.find({ productId }).lean();
		if (!variants.length) {
			return { success: true, message: "Sản phẩm chưa có biến thể", data: [] };
		}

		// Thu thập các attributeId & valueId đã dùng
		const usedAttributeIds = new Set();
		const usedValueIds = new Set();
		variants.forEach((v) => {
			(v.attributes || []).forEach((a) => {
				if (a.attributeId) usedAttributeIds.add(a.attributeId.toString());
				if (a.valueId) usedValueIds.add(a.valueId.toString());
			});
		});

		// Lấy chi tiết attribute và value
		const attributes = await Attribute.find({
			_id: { $in: [...usedAttributeIds] },
		}).lean();

		//Lấy giá trị (value) tương ứng — xử lý khác nhau cho global / shop
		const allAttributeValues = [];

		for (const attr of attributes) {
			const values = await AttributeValue.find({
				attributeId: attr._id,
				isActive: true,
				...(attr.isGlobal
					? { $or: [{ shopId: null }, { shopId }] }
					: { shopId }),
			}).lean();
			allAttributeValues.push(...values);
		}

		// Gom nhóm value theo attribute và đánh dấu isUsed
		const data = attributes.map((attr) => ({
			attributeId: attr._id,
			label: attr.label,
			isGlobal: attr.isGlobal,
			values: allAttributeValues
				.filter((v) => v.attributeId.toString() === attr._id.toString())
				.map((v) => ({
					valueId: v._id,
					value: v.value,
					image: v.image || "",
					isUsed: usedValueIds.has(v._id.toString()), // FE sẽ disable nếu true
				})),
		}));

		return { success: true, message: "Lấy danh sách thành công", data };
	} catch (error) {
		console.error("getProductAttributesWithValues error:", error);
		return {
			success: false,
			message: error.message || "Lỗi khi lấy danh sách thuộc tính và giá trị",
			data: [],
		};
	}
};

/**
 * Tạo nhiều ProductVariant cùng lúc (bulk create)
 *
 * @param {String|ObjectId} productId
 * @param {String|ObjectId} accountId  // để xác định shopId
 * @param {Array} variantsPayload - mỗi phần tử:
 *   {
 *     variantKey: "1|2",                 // chuỗi key (nên có, nếu không có thì backend có thể compute trước khi gọi)
 *     attributes: [{ attributeId, valueId }, ...],
 *     stock?: Number,
 *     priceAdjustment?: Number,
 *     image?: String
 *   }
 *
 * @returns { success, message, data } -- data = createdVariants (array)
 */
export const createProductVariantsBulk = async (
	productId,
	accountId,
	variantsPayload = [],
	tempFiles = [],
	session = null
) => {
	try {
		// --- Validate cơ bản ---
		if (!productId) throw new Error("Thiếu productId");
		if (!accountId) throw new Error("Thiếu accountId");
		if (!Array.isArray(variantsPayload) || variantsPayload.length === 0)
			throw new Error("Danh sách biến thể rỗng hoặc không hợp lệ");

		const productObjectId = toObjectId(productId);
		if (!productObjectId) throw new Error("productId không hợp lệ");

		// --- Lấy shopId từ accountId ---
		const shop = await Shop.findOne({ accountId }).select("_id").lean();
		if (!shop)
			throw new Error("Không tìm thấy shop tương ứng với tài khoản này");
		const shopId = shop._id;

		// --- Kiểm tra product hợp lệ ---
		const product = session
			? await Product.findById(productObjectId).session(session).lean()
			: await Product.findById(productObjectId).lean();
		if (!product) throw new Error("Không tìm thấy sản phẩm");
		if (product.shopId && product.shopId.toString() !== shopId.toString())
			throw new Error("Không có quyền tạo biến thể cho sản phẩm này");

		// --- Kiểm tra variantKey ---
		const payloadKeys = variantsPayload
			.map((v) => v.variantKey?.trim())
			.filter(Boolean);
		const dupInPayload = payloadKeys.filter(
			(k, i, arr) => arr.indexOf(k) !== i
		);
		if (dupInPayload.length)
			throw new Error(
				`Tồn tại variantKey trùng trong payload: ${[
					...new Set(dupInPayload),
				].join(", ")}`
			);

		// --- Chuẩn bị dữ liệu insert ---
		const toInsert = variantsPayload.map((v) => ({
			productId: productObjectId,
			variantKey: v.variantKey,
			attributes: v.attributes.map((a) => ({
				attributeId: toObjectId(a.attributeId),
				valueId: toObjectId(a.valueId),
			})),
			stock: typeof v.stock === "number" ? v.stock : 0,
			image: typeof v.image === "string" ? v.image : "",
			priceAdjustment:
				typeof v.priceAdjustment === "number" ? v.priceAdjustment : 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		}));

		let createdDocs = [];
		const exist = await ProductVariant.find({
			productId: productObjectId,
			variantKey: { $in: payloadKeys },
		})
			.session(session)
			.lean();

		if (exist.length) {
			throw new Error(
				`Một số variantKey đã tồn tại: ${exist
					.map((e) => e.variantKey)
					.join(", ")}`
			);
		}

		const inserted = await ProductVariant.insertMany(toInsert, { session });
		createdDocs = inserted;

		return {
			success: true,
			message: "Tạo biến thể sản phẩm hàng loạt thành công",
			data: createdDocs,
		};
	} catch (error) {
		rollbackFiles(tempFiles);
		return {
			success: false,
			message: error.message || "Lỗi khi tạo biến thể sản phẩm hàng loạt",
			data: [],
		};
	}
};

/**
 * Cập nhật 1 biến thể sản phẩm
 * @param {ObjectId} variantId
 * @param {Object} payload - dữ liệu cập nhật (stock, priceAdjustment, image)
 * @param {ObjectId} accountId - ID tài khoản (Shop)
 * @param {File} file - file ảnh mới (nếu có)
 */
export const updateProductVariant = async (
	variantId,
	payload,
	accountId = null,
	file = null
) => {
	const savedFiles = []; // file mới upload
	let backupPath = null; // file backup cũ
	let oldPath = null; // đường dẫn file cũ

	return withTransaction(async (session) => {
		try {
			if (!variantId) throw new Error("Thiếu ID biến thể");
			if (!mongoose.Types.ObjectId.isValid(variantId))
				throw new Error("ID không hợp lệ");

			const variant = await ProductVariant.findById(variantId)
				.populate("productId")
				.session(session);
			if (!variant) throw new Error("Không tìm thấy biến thể");

			const product = variant.productId;
			if (!product) throw new Error("Biến thể không có sản phẩm liên kết");

			// --- Quyền shop ---
			if (accountId) {
				const shop = await Shop.findOne({
					accountId: toObjectId(accountId),
					isDeleted: false,
				}).session(session);
				if (!shop) throw new Error("Không tìm thấy shop");
				if (product.shopId?.toString() !== shop._id.toString())
					throw new Error("Không có quyền sửa biến thể shop khác");
			}

			// --- Backup ảnh cũ trước khi cập nhật ---
			if (variant.image) {
				oldPath = path.join(PRODUCT_FOLDER, path.basename(variant.image));
				if (fs.existsSync(oldPath)) {
					backupPath = backupFile(oldPath);
				}
			}

			// --- Gán ảnh mới nếu có ---
			if (file) {
				payload.image = `${PRODUCTS_PUBLIC}/${file.filename}`;
				savedFiles.push(path.join(PRODUCT_FOLDER, file.filename));
			}

			// --- Nếu FE muốn xóa ảnh ---
			const removeImage = payload.image === "" && variant.image;

			// --- Validate ---
			if (payload.stock != null && (isNaN(payload.stock) || payload.stock < 0))
				throw new Error("Số lượng >= 0");
			if (payload.priceAdjustment != null && isNaN(payload.priceAdjustment))
				throw new Error("Giá điều chỉnh không hợp lệ");

			// --- Cập nhật variant ---
			variant.stock = payload.stock ?? variant.stock;
			variant.priceAdjustment =
				payload.priceAdjustment ?? variant.priceAdjustment;
			variant.image = removeImage ? "" : payload.image ?? variant.image;

			await variant.save({ session });

			await session.commitTransaction();

			// --- Thành công: xóa ảnh cũ ---
			if ((file || removeImage) && oldPath && fs.existsSync(oldPath))
				fs.unlinkSync(oldPath);
			if (backupPath) removeBackup(backupPath);

			return { success: true, message: "Cập nhật thành công", data: variant };
		} catch (error) {
			// rollback ảnh mới và restore ảnh cũ
			rollbackFiles(savedFiles);
			if (backupPath && oldPath) restoreFile(backupPath, oldPath);
			return { success: false, message: error.message, data: null };
		}
	});
};

// export const updateProductVariant = async (variantId, payload, accountId = null, file = null) => {
//   const savedFiles = []; // Ảnh mới upload để rollback
//   let backupPath = null; // File backup của ảnh cũ
//   let oldPath = null; // Đường dẫn ảnh cũ

//   return withTransaction(async (session) => {
//     try {
//       if (!variantId) throw new Error("Thiếu ID biến thể cần cập nhật");
//       if (!mongoose.Types.ObjectId.isValid(variantId)) throw new Error("ID không hợp lệ");

//       const variant = await ProductVariant.findById(variantId)
//         .populate("productId")
//         .session(session);
//       if (!variant) throw new Error("Không tìm thấy biến thể sản phẩm");

//       const product = variant.productId;
//       if (!product) throw new Error("Biến thể không có sản phẩm liên kết");

//       // --- Xác định quyền ---
//       let currentShopId = null;
//       if (accountId) {
//         const shop = await Shop.findOne({
//           accountId: toObjectId(accountId),
//           isDeleted: false,
//         }).session(session);
//         if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");

//         currentShopId = shop._id;
//         if (product.shopId?.toString() !== currentShopId.toString())
//           throw new Error("Bạn không có quyền sửa biến thể của sản phẩm thuộc shop khác!");
//       }

//       // --- Backup ảnh cũ ---
//       if (variant.image) {
//         oldPath = path.join(PRODUCT_FOLDER, path.basename(variant.image));
//         if (fs.existsSync(oldPath)) {
//           backupPath = backupFile(oldPath);
//         }
//       }

//       // --- Nếu có upload ảnh mới ---
//       if (file) {
//         const imagePath = `${PRODUCTS_PUBLIC}/${file.filename}`;
//         payload.image = imagePath;
//         savedFiles.push(path.join(PRODUCT_FOLDER, file.filename));
//       }

//       // --- Nếu FE muốn xóa ảnh ---
//       const removeImage = payload.image === "" && variant.image;

//       // --- Validate dữ liệu ---
//       if (payload.stock != null && (isNaN(payload.stock) || payload.stock < 0))
//         throw new Error("Số lượng phải là số >= 0");

//       if (payload.priceAdjustment != null && isNaN(payload.priceAdjustment))
//         throw new Error("Giá điều chỉnh không hợp lệ");

//       // --- Gán dữ liệu mới ---
//       const newImage = removeImage
//         ? ""
//         : payload.image
//         ? payload.image
//         : variant.image ?? "";

//       variant.stock = payload.stock ?? variant.stock;
//       variant.priceAdjustment = payload.priceAdjustment ?? variant.priceAdjustment;
//       variant.image = newImage;

//       await variant.save({ session });

//       await session.commitTransaction();

//       // === Sau khi thành công ===
//       if ((file || removeImage) && oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//       if (backupPath) removeBackup(backupPath);

//       return {
//         success: true,
//         message: "Cập nhật biến thể thành công",
//         data: variant,
//       };
//     } catch (error) {
//       // === Rollback khi lỗi ===
//       rollbackFiles(savedFiles);
//       if (backupPath && oldPath) restoreFile(backupPath, oldPath);
//       return { success: false, message: error.message, data: null };
//     }
//   });
// };
