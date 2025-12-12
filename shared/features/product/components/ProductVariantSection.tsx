"use client";

import React, { useState, useEffect } from "react";
import {
	Settings2,
	Plus,
	Trash2,
	Save,
	X,
	Edit,
	Image as ImageIcon,
	Layers,
	Box,
	Wrench,
	AlertCircle,
	Loader2,
	CheckCircle2,
	RotateCw,
	Tags,
	Shapes,
	Tag,
	Coins,
	Warehouse,
	Info,
	Lightbulb,
	Check,
	CheckCheck,
} from "lucide-react";
import clsx from "clsx";
import { set, useFormContext } from "react-hook-form";

// Shared UI Components
import {
	Table,
	Select,
	SelectItem,
	Input,
	GradientButton,
	SidebarTooltip,
} from "@shared/core/components/ui";
import { buildImageUrl } from "@shared/core/utils/image.utils";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { formatCurrency } from "@shared/core/utils";

// Hooks & Types
import {
	useProductVariant,
	ProductDetail,
	ProductAttributeWithValues,
} from "../index";
import { useAttribute } from "@shared/features/attribute/attribute.hook";
import { CardAttributeValue } from "@shared/features/attribute/components/CardAttributeValue";
import { Attribute } from "@shared/features/attribute/attribute.types";
import { AttributeValue } from "@shared/features/attribute/attributeValue.types";
import { i } from "node_modules/framer-motion/dist/types.d-BJcRxCew";

// ==========================================
// 1. COMPONENTS CON: Modal Chọn Giá Trị (Dùng CardAttributeValue)
// ==========================================
interface ValueSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	attribute: ProductAttributeWithValues;
	selectedValues: string[];
	onConfirm: (values: string[]) => void;
	isCreateMode: boolean;
}

const ValueSelectionModal: React.FC<ValueSelectionModalProps> = ({
	isOpen,
	onClose,
	attribute,
	selectedValues,
	onConfirm,
	isCreateMode,
}) => {
	const [tempSelected, setTempSelected] = useState<string[]>(selectedValues);

	useEffect(() => {
		if (isOpen) {
			// 1. Lấy danh sách các ID đã chọn từ props (do user chọn trước đó)
			const initialSelected = new Set(selectedValues);

			// 2. Nếu KHÔNG phải Create Mode, tự động thêm các value isUsed=true vào
			if (!isCreateMode) {
				attribute.values.forEach((val) => {
					if (val.isUsed) {
						initialSelected.add(val.valueId);
					}
				});
			}

			setTempSelected(Array.from(initialSelected));
		}
	}, [isOpen, selectedValues, isCreateMode, attribute.values]);

	if (!isOpen) return null;

	const handleToggle = (valId: string, isUsed: boolean) => {
		// CHẶN: Không cho bỏ chọn nếu giá trị đang được sử dụng trong sản phẩm
		if (!isCreateMode && isUsed && tempSelected.includes(valId)) return;

		setTempSelected((prev) =>
			prev.includes(valId)
				? prev.filter((id) => id !== valId)
				: [...prev, valId]
		);
	};
	// Mock object Attribute để truyền vào CardAttributeValue
	// Vì CardAttributeValue mong đợi type Attribute từ feature attribute
	const mockAttributeForCard: Attribute = {
		_id: attribute.attributeId,
		label: attribute.label,
		isGlobal: attribute.isGlobal,
		isActive: true,
		shopId: null, // Không quan trọng ở view này
		createdAt: "",
		updatedAt: "",
	};

	return (
		<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
				{/* Header */}
				<div className="flex justify-between items-center mb-4 border-b pb-3">
					<h3 className="text-xl font-bold text-gray-800">
						Chọn giá trị cho:{" "}
						<span className="text-blue-600">{attribute.label}</span>
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600">
						<X size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
					{attribute.values.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-gray-500">
							<AlertCircle size={40} className="mb-2 text-gray-400" />
							<p>Không tìm thấy giá trị nào.</p>
							<span className="text-sm">
								Vui lòng kiểm tra lại cấu hình thuộc tính này.
							</span>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
							{attribute.values.map((val) => {
								const isSelected = tempSelected.includes(val.valueId);
								// Map data sang type AttributeValue
								const mockValueForCard: AttributeValue = {
									_id: val.valueId,
									attributeId: attribute.attributeId,
									value: val.value,
									image: val.image,
									shopId: null,
									isActive: true,
									createdAt: "",
									updatedAt: "",
								};

								// Nếu edit mode + isUsed -> disable click trong logic handleToggle,
								// nhưng ở UI Card có thể hiện thị khác.
								// CardAttributeValue có prop `selected` và `onSelectChange`

								return (
									<div
										key={val.valueId}
										className={clsx(
											"relative transition-all",
											!isCreateMode &&
												val.isUsed &&
												isSelected &&
												"opacity-80 grayscale-[0.2]" // Visual feedback cho item đã dùng
										)}>
										<CardAttributeValue
											attribute={mockAttributeForCard}
											value={mockValueForCard}
											selectable={true}
											selected={isSelected}
											showActions={false} // Ẩn nút sửa/xóa
											showStatus={false}
											mini={true} // Hiển thị nhỏ gọn
											onSelectChange={() =>
												handleToggle(val.valueId, val.isUsed)
											}
										/>
										{/* Overlay Icon nếu bị disabled (đã dùng) trong Edit Mode */}
										{!isCreateMode && val.isUsed && isSelected && (
											<div
												className="absolute top-1 right-1 z-10 text-gray-500 bg-white rounded-full p-0.5 shadow-sm"
												title="Đang được sử dụng">
												<CheckCircle2 size={14} />
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end gap-3 mt-6 pt-3 border-t">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">
						Hủy
					</button>
					<button
						disabled={attribute.values.length === 0}
						onClick={() => {
							onConfirm(tempSelected);
							onClose();
						}}
						className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium shadow-sm">
						Xác nhận ({tempSelected.length})
					</button>
				</div>
			</div>
		</div>
	);
};

// ==========================================
// 2. MAIN COMPONENT: ProductVariantSection
// ==========================================
interface ProductVariantSectionProps {
	product?: ProductDetail | null;
	isShop?: boolean;
	createMode?: boolean;
	onRefresh?: () => void;
}

export const ProductVariantSection: React.FC<ProductVariantSectionProps> = ({
	product,
	isShop = false,
	createMode = false,
	onRefresh,
}) => {
	const { showToast } = useNotification();

	// Hooks
	const {
		generateVariantCombinations,
		generateNewVariantCombinations,
		bulkCreateProductVariants,
		updateProductVariant,
		getProductAttributesWithValues,
	} = useProductVariant();

	const { getShopAvailableAttributes, getShopAvailableAttributeById } =
		useAttribute();

	// --- STATES ---
	const [mode, setMode] = useState<"view" | "generate">("view");
	const [isEditingVariant, setIsEditingVariant] = useState(false);

	const [attributesList, setAttributesList] = useState<
		ProductAttributeWithValues[]
	>([]);

	const [generatorRows, setGeneratorRows] = useState<
		{ id: number; attributeId: string; values: string[] }[]
	>([
		{ id: 1, attributeId: "", values: [] },
		{ id: 2, attributeId: "", values: [] },
		{ id: 3, attributeId: "", values: [] },
	]);

	const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
	const [variantRows, setVariantRows] = useState<any[]>([]);
	const [editingData, setEditingData] = useState<
		Record<
			string,
			{ stock: number; priceAdjustment: number; file?: File | null }
		>
	>({});
	// State lưu danh sách tên thuộc tính để làm tiêu đề cột (VD: ["Màu sắc", "Kích thước"])
	const [dynamicAttributeHeaders, setDynamicAttributeHeaders] = useState<
		string[]
	>([]);

	const [isLoadingAttribute, setIsLoadingAttribute] = useState<string | null>(
		null
	);
	// Lấy context từ cha (chỉ có ở createMode)
	const formContext = createMode ? useFormContext() : null;
	// --- 1. INIT LOAD DATA ---
	useEffect(() => {
		const init = async () => {
			// Chỉ chạy khi ở Create Mode và có Form Contex
			if (createMode) {
				// --- Load attribute khi createMode ---
				const attrRes = await getShopAvailableAttributes({ limit: 100 });
				if (attrRes.success && attrRes.data) {
					const mapped = attrRes.data.attributes.map((attr: any) => ({
						attributeId: attr._id,
						label: attr.label,
						isGlobal: attr.isGlobal,
						values: [],
					}));
					setAttributesList(mapped);
				}

				// Set mode theo hướng dẫn
				setMode("generate");
				setVariantRows([]);
				setDynamicAttributeHeaders([]);
				return;
			}

			// --- Load product khi edit mode ---
			if (product && isShop) {
				// console.log("ProductVariantSection Init:", product);
				// Gọi API lấy attributes CỦA PRODUCT trước
				let attrRes = await getProductAttributesWithValues(product._id);

				// console.log("[Init] Attributes Loaded:", attrRes); // <--- LOG KIỂM TRA

				if (attrRes.success && (!attrRes.data || attrRes.data.length === 0)) {
					console.log(
						"Product has no attributes -> Loading Shop Attributes..."
					);
					// Gọi API lấy danh sách attribute của shop để user chọn
					const shopAttrRes = await getShopAvailableAttributes({ limit: 100 });
					if (shopAttrRes.success && shopAttrRes.data) {
						// Map lại format
						const mapped = shopAttrRes.data.attributes.map((attr: any) => ({
							attributeId: attr._id,
							label: attr.label,
							isGlobal: attr.isGlobal,
							values: [], // Chưa có value nào used
						}));
						setAttributesList(mapped);
					}
				} else if (attrRes.success && attrRes.data) {
					setAttributesList(attrRes.data);
				}
				// Log variants raw để kiểm tra cấu trúc attributes
				// console.log("Variants Raw Data:", product.variants);

				if (product.variants && product.variants.length > 0) {
					setVariantRows(product.variants);

					// --- LOGIC TÁCH CỘT (UNION) ---
					const allLabels = new Set<string>();

					product.variants.forEach((v, idx) => {
						// Log từng dòng variant xem attributes của nó có gì
						// console.log(`Variant #${idx} Attributes:`, v.attributes);

						v.attributes.forEach((a) => {
							if (a.attributeLabel) {
								allLabels.add(a.attributeLabel);
							}
						});
					});

					const headers = Array.from(allLabels);
					setDynamicAttributeHeaders(headers);
					setMode("view");
				} else {
					setVariantRows([]);
					setDynamicAttributeHeaders([]);
					setMode("generate");
				}
			}
		};
		init();
	}, [createMode, product]);
	// --- 2. SYNC VARIANT TABLE DATA (giữ nguyên useEffect thứ 2, có thể tinh gọn) ---
	useEffect(() => {
		if (createMode) {
			setMode("generate");
			setVariantRows([]);
			return;
		}

		if (!product) return;

		// --- SAFE CHECK ---
		const variants = product.variants ?? []; // luôn là array, không còn undefined

		if (variants.length > 0) {
			setVariantRows(variants); // OK vì variants luôn là ProductVariantDetail[]

			const firstVariant = variants[0];

			// Tách cột thuộc tính
			const headers =
				firstVariant?.attributes?.map(
					(a) => a.attributeLabel || "Thuộc tính"
				) ?? [];

			setDynamicAttributeHeaders(headers);
			setMode("view");
		} else {
			setVariantRows([]);
			setDynamicAttributeHeaders([]);
			setMode("generate");
		}
	}, [product]);

	// --- LIVE SYNC DATA TO FORM CONTEXT (CREATE MODE ONLY) ---
	useEffect(() => {
		// Chỉ chạy khi ở Create Mode và có Form Context
		if (createMode && formContext) {
			// Gom dữ liệu từ bảng (variantRows) và dữ liệu đang nhập (editingData)
			const payload = variantRows.map((v) => {
				const stock = editingData[v._id]?.stock ?? v.stock;
				const priceAdjustment =
					editingData[v._id]?.priceAdjustment ?? v.priceAdjustment;
				const file = editingData[v._id]?.file;

				// Tạo fileKey nếu có file
				const fileKey = file ? `file_${v.variantKey}` : undefined;

				// Nếu có file, set ngay vào Form Context
				if (file && fileKey) {
					formContext.setValue(fileKey, file);
				}

				return {
					variantKey: v.variantKey,
					attributes: v.attributes.map((a: any) => ({
						attributeId: a.attributeId,
						valueId: a.valueId,
					})),
					stock: Number(stock),
					priceAdjustment: Number(priceAdjustment),
					fileKey: fileKey,
				};
			});

			// Cập nhật field chính variantsPayload
			// console.log("[Auto Sync] Variants to Form:", payload);
			formContext.setValue("variantsPayload", payload);
		}
	}, [variantRows, editingData, createMode, formContext]);
	// Chạy lại mỗi khi danh sách dòng thay đổi hoặc người dùng nhập liệu

	const handleAttributeChange = async (rowIndex: number, attrId: string) => {
		// 1. Cập nhật UI
		const newRows = [...generatorRows];
		newRows[rowIndex].attributeId = attrId;
		newRows[rowIndex].values = [];
		setGeneratorRows(newRows);

		// 2. Kiểm tra data values
		const existingAttr = attributesList.find((a) => a.attributeId === attrId);

		if (existingAttr && existingAttr.values.length === 0) {
			if (createMode) {
				setIsLoadingAttribute(attrId);
				try {
					const res = await getShopAvailableAttributeById(attrId);
					// SỬA LỖI TS: Gán res.data vào biến
					if (res.success && res.data) {
						const fetchedData = res.data; // AttributeWithValues
						setAttributesList((prev) =>
							prev.map((item) => {
								if (item.attributeId === attrId) {
									// Check if values exist array
									const vals = fetchedData.values || [];
									const newValues = vals.map((v: any) => ({
										valueId: v._id,
										value: v.value,
										image: v.image,
										isUsed: false,
									}));
									return { ...item, values: newValues };
								}
								return item;
							})
						);
					}
				} catch (error) {
					console.error("Error fetching attribute detail", error);
					showToast("Lỗi tải giá trị thuộc tính", "error");
				} finally {
					setIsLoadingAttribute(null);
				}
			} else {
				showToast("Thuộc tính này chưa có giá trị nào", "error");
			}
		}
	};

	const handleValuesConfirm = (rowIndex: number, values: string[]) => {
		const newRows = [...generatorRows];
		newRows[rowIndex].values = values;
		setGeneratorRows(newRows);
	};

	const handleDeleteRow = (rowIndex: number) => {
		const newRows = [...generatorRows];
		newRows[rowIndex] = {
			id: newRows[rowIndex].id,
			attributeId: "",
			values: [],
		};
		setGeneratorRows(newRows);
	};

	const handleGenerate = async () => {
		// 1. Lấy dữ liệu từ UI (Generator Rows)
		const uiSelectedRows = generatorRows.filter(
			(r) => r.attributeId && r.values.length > 0
		);

		// console.log(" [Generate] UI Selected Rows:", uiSelectedRows);

		// 2. Xây dựng Payload Attributes
		let payloadAttributes: { attributeId: string; values: string[] }[] = [];

		if (createMode) {
			// --- CREATE MODE: Chỉ lấy từ UI ---
			if (uiSelectedRows.length === 0) {
				showToast("Vui lòng chọn ít nhất 1 thuộc tính và giá trị", "error");
				return;
			}
			payloadAttributes = uiSelectedRows.map((r) => ({
				attributeId: r.attributeId,
				values: r.values,
			}));
		} else {
			// --- EDIT MODE: Merge UI + Dữ liệu cũ (isUsed) ---

			// Map dùng để gộp giá trị (tránh trùng lặp): AttributeId -> Set<ValueId>
			const mergedMap = new Map<string, Set<string>>();

			// B1: Đưa tất cả giá trị đang được sử dụng (isUsed=true) vào Map
			// Dữ liệu này lấy từ attributesList (đã load từ API getProductAttributesWithValues)
			attributesList.forEach((attr) => {
				attr.values.forEach((val) => {
					if (val.isUsed) {
						if (!mergedMap.has(attr.attributeId)) {
							mergedMap.set(attr.attributeId, new Set());
						}
						mergedMap.get(attr.attributeId)!.add(val.valueId);
					}
				});
			});

			// B2: Đưa các giá trị mới chọn từ UI vào Map
			uiSelectedRows.forEach((row) => {
				if (!mergedMap.has(row.attributeId)) {
					mergedMap.set(row.attributeId, new Set());
				}
				row.values.forEach((valId) =>
					mergedMap.get(row.attributeId)!.add(valId)
				);
			});

			// B3: Chuyển về mảng Payload
			payloadAttributes = Array.from(mergedMap.entries()).map(
				([attrId, valSet]) => ({
					attributeId: attrId,
					values: Array.from(valSet),
				})
			);

			// console.log(" [Generate] Merged Payload:", payloadAttributes);

			if (payloadAttributes.length === 0) {
				showToast("Vui lòng chọn thuộc tính để sinh biến thể", "error");
				return;
			}
		}

		const payload = {
			attributes: payloadAttributes,
		};

		// console.log(
		// 	" [Generate] Sending Payload (Full):",
		// 	JSON.stringify(payload, null, 2)
		// );

		// --- PHẦN LOGIC MAP LABEL ĐỂ HIỂN THỊ (Giữ nguyên) ---
		const attrLabelMap: Record<string, string> = {};
		const valueLabelMap: Record<string, string> = {};
		attributesList.forEach((attr) => {
			attrLabelMap[attr.attributeId] = attr.label;
			attr.values.forEach((val) => {
				valueLabelMap[val.valueId] = val.value;
			});
		});

		const headers = payload.attributes.map(
			(r) => attrLabelMap[r.attributeId] || "Thuộc tính"
		);
		setDynamicAttributeHeaders(headers);
		// console.log("Calling API Generate with:", JSON.stringify(payload));
		// --- GỌI API ---
		let res;
		if (createMode) {
			res = await generateVariantCombinations(payload);
		} else if (product) {
			res = await generateNewVariantCombinations({
				...payload,
				productId: product._id,
			});
		}

		// --- XỬ LÝ KẾT QUẢ ---
		if (res?.success && res.data) {
			// console.log(" API Response Data:", res.data);

			if (res.data.length === 0) {
				showToast(
					"Không sinh được biến thể mới nào. Vui lòng kiểm tra lại các thuộc tính và giá trị đã chọn.",
					"error"
				);
				return;
			}

			// Map dữ liệu để hiển thị lên bảng
			const newVariants = res.data.map((item: any, idx: number) => ({
				...item,
				_id: `temp_${Date.now()}_${idx}`,
				stock: 0,
				priceAdjustment: 0,
				image: "",
				isNew: true,
				attributes: item.attributes.map((attr: any) => ({
					...attr,
					// Map label từ danh sách gốc để hiển thị
					attributeLabel: attrLabelMap[attr.attributeId] || "Unknown",
					valueLabel: valueLabelMap[attr.valueId] || "Unknown",
				})),
			}));

			setVariantRows(newVariants);
			setMode("view");
			// showToast(`Đã sinh ${newVariants.length} biến thể mới`, "success");
		}
	};

	// --- INLINE EDIT & BULK SAVE Logic ---
	const startInlineEdit = (variant: any) => {
		setEditingData((prev) => ({
			...prev,
			[variant._id]: {
				stock: variant.stock,
				priceAdjustment: variant.priceAdjustment,
				file: null,
			},
		}));
	};

	const cancelInlineEdit = (variantId: string) => {
		const newData = { ...editingData };
		delete newData[variantId];
		setEditingData(newData);
	};

	const saveInlineEdit = async (variantId: string) => {
		const data = editingData[variantId];
		if (!data) return;
		const formData = new FormData();
		formData.append("stock", String(data.stock));
		formData.append("priceAdjustment", String(data.priceAdjustment));
		if (data.file) formData.append("image", data.file);

		const res = await updateProductVariant(variantId, formData);
		if (res.success) {
			cancelInlineEdit(variantId);
			if (onRefresh) onRefresh();
		}
	};

	const handleBulkSave = async () => {
		if (createMode) return;
		if (!product) return;

		const newVariantsToSave = variantRows.filter((v) => v.isNew);
		if (newVariantsToSave.length === 0) {
			showToast("Không có biến thể mới để lưu", "error");
			return;
		}

		const variantsPayload = newVariantsToSave.map((v) => ({
			variantKey: v.variantKey,
			attributes: v.attributes,
			stock: editingData[v._id]?.stock ?? v.stock,
			priceAdjustment: editingData[v._id]?.priceAdjustment ?? v.priceAdjustment,
			fileKey: `var_${v.variantKey}`,
		}));

		const formData = new FormData();
		formData.append("productId", product._id);
		formData.append("variantsPayload", JSON.stringify(variantsPayload));

		newVariantsToSave.forEach((v) => {
			const file = editingData[v._id]?.file;
			if (file) formData.append(`var_${v.variantKey}`, file);
		});

		const res = await bulkCreateProductVariants(formData);
		if (res.success) {
			setMode("view");
			setVariantRows([]);
			if (onRefresh) onRefresh();
		}
	};

	// --- RENDER HELPERS ---
	const renderGeneratorTable = () => {
		const activeAttribute =
			activeRowIndex !== null
				? attributesList.find(
						(a) => a.attributeId === generatorRows[activeRowIndex]?.attributeId
				  )
				: null;

		const columns = [
			{
				key: "attribute",
				title: "Thuộc tính",
				icon: Shapes,
				iconColor: "text-indigo-600",
				width: 200,
				render: (row: any, idx: number) => (
					<Select
						value={row.attributeId}
						onValueChange={(val) => handleAttributeChange(idx, val)}
						placeholder="Chọn thuộc tính"
						className="w-full">
						{attributesList.map((attr) => (
							<SelectItem key={attr.attributeId} value={attr.attributeId}>
								{attr.label}
							</SelectItem>
						))}
					</Select>
				),
			},
			{
				key: "value",
				title: "Giá trị",
				icon: Tags,
				iconColor: "text-indigo-600",
				width: 300,
				render: (row: any, idx: number) => {
					const attr = attributesList.find(
						(a) => a.attributeId === row.attributeId
					);
					const selectedCount = row.values.length;
					const isThisLoading = isLoadingAttribute === row.attributeId;

					return (
						<button
							disabled={!row.attributeId || isThisLoading}
							onClick={() => setActiveRowIndex(idx)}
							className={clsx(
								"w-full px-3 py-2 text-left border rounded-lg transition-colors truncate flex items-center justify-between",
								!row.attributeId
									? "bg-gray-100 text-gray-400 cursor-not-allowed"
									: "bg-white hover:border-blue-400 hover:shadow-sm text-gray-700"
							)}>
							<span className="truncate">
								{isThisLoading ? (
									"Đang tải giá trị..."
								) : selectedCount > 0 ? (
									`Đã chọn (${selectedCount}): ${row.values
										.map(
											(vId: string) =>
												attr?.values.find((v) => v.valueId === vId)?.value ||
												"N/A"
										)
										.join(", ")}`
								) : (
									<span className="text-gray-400">
										Click để chọn giá trị...
									</span>
								)}
							</span>
							{isThisLoading && (
								<Loader2
									size={16}
									className="animate-spin text-blue-500 ml-2"
								/>
							)}
						</button>
					);
				},
			},
			{
				key: "action",
				title: "Xóa",
				width: 80,
				align: "center" as const,
				render: (_: any, idx: number) => (
					<div className="relative flex items-center justify-center">
						<button
							onClick={() => handleDeleteRow(idx)}
							className="
								peer
								flex items-center gap-1
								bg-gradient-to-r from-red-500 via-red-600 to-red-700
								text-white 
								px-3 py-1 rounded-full
								hover:from-red-600 hover:via-red-700 hover:to-red-800
								transition shadow-sm
							">
							<Trash2 size={18} />
						</button>

						{/* Tooltip */}
						<SidebarTooltip label="Xóa dòng này" position="top" />
					</div>
				),
			},
		];

		return (
			<div className="animate-in fade-in space-y-4">
				<div className="flex justify-between items-center">
					<h3 className="font-bold text-indigo-700 flex items-center gap-2 uppercase tracking-wide drop-shadow-sm relative">
						<Wrench size={20} className="text-indigo-700" /> Bộ sinh biến thể
						<span className="absolute left-0 -bottom-1 w-60 h-[1px] bg-indigo-600 rounded-full"></span>
					</h3>

					<div className="flex gap-2">
						{!createMode &&
							product &&
							product.variants &&
							product.variants.length > 0 && (
								<GradientButton
									// onClick={() => setMode("view")}
									onClick={onRefresh}
									icon={X}
									label="Hủy"
									gradient="bg-red-50 hover:bg-red-100"
									labelColor="text-red-700"
									iconColor="text-red-700"
									className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
									roundedFull
									shadow
								/>
							)}
						<GradientButton
							onClick={handleGenerate}
							icon={Layers}
							label="Sinh biến thể"
							className="!py-1.5"
						/>
					</div>
				</div>
				{/* 2. GUIDE NOTE (MỚI THÊM) */}
				<div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex gap-4 items-start animate-in slide-in-from-top-2 duration-300 shadow-sm">
					{/* Icon Bóng đèn nổi bật */}
					<div className="p-2 bg-white rounded-full shadow-sm shrink-0 text-amber-500 border border-amber-100">
						<Lightbulb size={20} strokeWidth={2.5} className="fill-amber-100" />
					</div>

					<div className="space-y-2 w-full">
						<h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
							Quy trình tạo tổ hợp biến thể
							<span className="text-[10px] font-normal bg-white border border-indigo-200 px-2 py-0.5 rounded-full text-indigo-500">
								Tự động
							</span>
						</h4>

						{/* Các bước hướng dẫn */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-indigo-800/80 font-medium">
							{/* Bước 1 */}
							<div className="flex items-start gap-2">
								<span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold shadow-sm">
									1
								</span>
								<span>
									Chọn <b>Thuộc tính</b> ở cột trái (VD: Màu sắc, Kích
									thước...).
								</span>
							</div>

							{/* Bước 2 */}
							<div className="flex items-start gap-2">
								<span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold shadow-sm">
									2
								</span>
								<span>
									Click vào ô <b>Giá trị</b> để chọn các phân loại chi tiết (VD:
									Xanh, Đỏ, S, M...).
								</span>
							</div>

							{/* Bước 3 */}
							<div className="flex items-start gap-2">
								<span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm shadow-blue-200">
									3
								</span>
								<span>
									Bấm nút <b className="text-blue-600">Sinh biến thể</b> để hệ
									thống tự động tạo danh sách.
								</span>
							</div>
						</div>
					</div>
				</div>
				<Table
					columns={columns}
					data={generatorRows}
					showIndex
					showPagination={false}
					sttIconColor="text-indigo-600"
					headerColor="bg-gradient-to-r from-blue-100 via-indigo-200 to-pink-100 text-indigo-600 font-extrabold tracking-wider shadow-md"
				/>

				{activeRowIndex !== null && activeAttribute && (
					<ValueSelectionModal
						isOpen={true}
						onClose={() => setActiveRowIndex(null)}
						attribute={activeAttribute}
						selectedValues={generatorRows[activeRowIndex].values}
						onConfirm={(vals) => handleValuesConfirm(activeRowIndex, vals)}
						isCreateMode={createMode}
					/>
				)}
			</div>
		);
	};

	const renderVariantTable = () => {
		const isTempTable = variantRows.length > 0 && variantRows[0].isNew;
		const showEditActions = isShop && !isTempTable && isEditingVariant;

		const columns: any[] = [
			{
				key: "image",
				icon: ImageIcon,
				iconColor: "text-indigo-600",
				title: "Ảnh",
				width: 120,
				align: "center",
				render: (row: any) => {
					const isEditing =
						isTempTable || (showEditActions && editingData[row._id]);
					const currentImg = editingData[row._id]?.file
						? URL.createObjectURL(editingData[row._id]?.file!)
						: row.image
						? buildImageUrl(row.image)
						: "";

					return (
						<div className="flex flex-col items-center gap-2 py-1">
							{/* Khu vực hiển thị ảnh */}
							<div className="relative flex-shrink-0">
								{currentImg ? (
									<img
										src={currentImg}
										className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-200"
										alt="Variant"
									/>
								) : (
									<div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
										<ImageIcon size={20} strokeWidth={1.5} />
									</div>
								)}
							</div>

							{/* Nút Upload (Chỉ hiện khi Edit) */}
							{isEditing && (
								<label className="cursor-pointer group">
									<div
										className="
										flex items-center justify-center gap-1 px-3 py-1
										bg-gradient-to-r from-indigo-500 to-blue-600
										text-white text-[10px] font-semibold
										rounded-full shadow-sm
										hover:from-indigo-600 hover:to-blue-700
										hover:shadow-md hover:scale-105
										transition-all duration-200
									">
										<Plus size={12} strokeWidth={3} />
										<span>Chọn ảnh</span>
									</div>

									{/* Input ẩn giữ nguyên logic */}
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => {
											if (e.target.files?.[0]) {
												setEditingData((prev) => ({
													...prev,
													[row._id]: {
														...(prev[row._id] || row),
														file: e.target.files![0],
													},
												}));
											}
										}}
									/>
								</label>
							)}
						</div>
					);
				},
			},
		];

		if (dynamicAttributeHeaders.length > 0) {
			dynamicAttributeHeaders.forEach((headerLabel) => {
				columns.push({
					key: headerLabel, // Dùng label làm key
					title: headerLabel,
					icon: Shapes,
					iconColor: "text-indigo-600",
					width: 120,
					align: "center",
					render: (row: any) => {
						// Tìm attribute có label khớp với cột hiện tại
						const attr = row.attributes?.find(
							(a: any) => a.attributeLabel === headerLabel
						);
						return (
							<div className="flex items-center justify-center">
								{attr ? (
									<span
										className={clsx(
											"inline-flex items-center gap-1",
											"px-2.5 py-1 rounded-full text-sm font-medium text-indigo-800"
											// "bg-white border border-indigo-200 ",
											// "shadow-sm hover:shadow transition-all duration-200"
										)}>
										{attr.valueLabel}
									</span>
								) : (
									<span
										className="
											inline-flex items-center gap-1
											px-2 py-1 rounded-full text-sm font-medium
											bg-red-50 text-red-500 border border-red-200
											italic opacity-70
										">
										—
									</span>
								)}
							</div>
						);
					},
				});
			});
		}

		columns.push(
			{
				key: "price",
				icon: Coins,
				iconColor: "text-indigo-600",
				title: "Giá điều chỉnh +/-",
				width: 120,
				align: "right",
				render: (row: any) => {
					const isEditing =
						isTempTable || (showEditActions && editingData[row._id]);
					const val =
						editingData[row._id]?.priceAdjustment ?? row.priceAdjustment;

					if (isEditing) {
						return (
							<div className="flex flex-col gap-1 w-full">
								<input
									type="number"
									step={1000}
									className={clsx(
										"w-full min-w-[80px] px-3 py-1.5 h-9 text-right text-sm font-bold border rounded-lg outline-none transition-all shadow-sm",
										"focus:ring-2 focus:ring-indigo-500/20 focus:bg-white",
										val > 0
											? "text-emerald-600 border-emerald-200 bg-emerald-50/30 focus:border-emerald-500"
											: val < 0
											? "text-red-600 border-red-200 bg-red-50/30 focus:border-red-500"
											: "text-gray-700 border-gray-300 bg-white focus:border-indigo-500"
									)}
									placeholder="0"
									value={val === 0 ? "" : val}
									onChange={(e) => {
										const inputVal = e.target.value;
										const numVal = inputVal === "" ? 0 : Number(inputVal);

										setEditingData((prev) => ({
											...prev,
											[row._id]: {
												...(prev[row._id] || row),
												priceAdjustment: numVal,
											},
										}));
									}}
								/>

								{/* Helper Text nằm dưới (Block element) */}
								<div className="text-right">
									<span
										className={clsx(
											"text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block",
											val > 0
												? "text-emerald-600 bg-emerald-50"
												: val < 0
												? "text-red-600 bg-red-50"
												: "text-gray-400 bg-gray-100"
										)}>
										{val !== 0 ? formatCurrency(val) : "0 ₫"}
									</span>
								</div>
							</div>
						);
					}
					return (
						<span
							className={clsx(
								val > 0
									? "text-green-600 font-medium"
									: val < 0
									? "text-red-600 font-medium"
									: "text-gray-500"
							)}>
							{val > 0 ? "+" : ""}
							{val !== 0 ? formatCurrency(val) : "0"}
						</span>
					);
				},
			},
			{
				key: "stock",
				title: "Tồn kho",
				icon: Warehouse,
				iconColor: "text-indigo-600",
				width: 70,
				align: "center",
				render: (row: any) => {
					const isEditing =
						isTempTable || (showEditActions && editingData[row._id]);
					const val = editingData[row._id]?.stock ?? row.stock;
					if (isEditing) {
						return (
							<Input
								type="number"
								min={0}
								value={val === 0 ? "" : val}
								onChange={(e) => {
									const inputVal = e.target.value;
									// Nếu input rỗng -> set về 0, ngược lại parse số
									const numVal = inputVal === "" ? 0 : Number(inputVal);

									setEditingData((prev) => ({
										...prev,
										[row._id]: {
											...(prev[row._id] || row),
											stock: numVal,
										},
									}));
								}}
								className="!py-1 text-center h-8 w-full"
								placeholder="0"
							/>
						);
					}
					return (
						<span
							className={clsx(
								"font-bold",
								val > 0 ? "text-indigo-800" : "text-red-500"
							)}>
							{val}
						</span>
					);
				},
			}
		);

		// Cột Hành động (Chỉ hiện khi isShop bật chế độ Edit hoặc là bảng Temp)
		if (isShop && (isTempTable || isEditingVariant)) {
			columns.push({
				key: "action",
				title: "Hành động",
				icon: Settings2,
				iconColor: "text-indigo-600",
				width: 90,
				align: "center",
				render: (row: any) => {
					if (isTempTable)
						return (
							<div className="relative flex items-center justify-center">
								<button
									onClick={() =>
										setVariantRows((prev) =>
											prev.filter((r) => r._id !== row._id)
										)
									}
									className="
								peer
								flex items-center gap-1
								bg-gradient-to-r from-red-500 via-red-600 to-red-700
								text-white 
								px-3 py-1 rounded-full
								hover:from-red-600 hover:via-red-700 hover:to-red-800
								transition shadow-sm
							">
									<Trash2 size={18} />
								</button>

								{/* Tooltip */}
								<SidebarTooltip label="Xóa dòng này" position="top" />
							</div>
						);

					if (editingData[row._id]) {
						return (
							<div className="flex gap-1 justify-center">
								<div className="relative flex items-center justify-center">
									<button
										onClick={() => saveInlineEdit(row._id)}
										className="
											peer
											flex items-center gap-1
											bg-gradient-to-r from-blue-500 to-purple-600
											text-white 
											px-3 py-1 rounded-full
											hover:from-blue-600 hover:to-purple-700
											transition shadow-sm
										">
										<Save size={18} />
									</button>

									{/* Tooltip */}
									<SidebarTooltip label="Lưu" position="bottom" />
								</div>
								<div className="relative flex items-center justify-center">
									<button
										onClick={() => cancelInlineEdit(row._id)}
										className="
											peer
											flex items-center gap-1
											bg-gradient-to-r from-red-500 via-red-600 to-red-700
											text-white 
											px-3 py-1 rounded-full
											hover:from-red-600 hover:via-red-700 hover:to-red-800
											transition shadow-sm
										">
										<X size={18} />
									</button>

									{/* Tooltip */}
									<SidebarTooltip label="Hủy" position="bottom" />
								</div>
							</div>
						);
					}
					// Nút edit dòng (chỉ hiện khi chưa click vào dòng đó)
					return (
						<div className="relative flex items-center justify-center">
							<button
								onClick={() => startInlineEdit(row)}
								className="
												peer
												flex items-center gap-1
												bg-gradient-to-r from-yellow-400 to-orange-500
												text-white 
												px-3 py-1 rounded-full
												hover:from-yellow-500 hover:to-orange-600
												transition shadow-sm
											">
								<Edit size={18} />
							</button>
							<SidebarTooltip label="Chỉnh sửa" position="bottom" />
						</div>
					);
				},
			});
		}

		return (
			<div className="space-y-3 animate-in fade-in">
				<div className="flex justify-between items-center h-10">
					<h3 className="font-bold text-indigo-700 flex items-center gap-2 uppercase tracking-wide drop-shadow-sm relative">
						<Box size={20} className="text-indigo-700" /> Danh sách biến thể
						<span className="absolute left-0 -bottom-1 w-60 h-[2px] bg-indigo-600 rounded-full"></span>
					</h3>

					{isShop && (
						<div className="flex gap-2">
							{isTempTable ? (
								<>
									<GradientButton
										onClick={() => {
											setMode("generate");
											setVariantRows([]);
											// Nếu cancel thì nhớ clear data trong form luôn
											if (createMode && formContext)
												formContext.setValue("variantsPayload", []);
										}}
										icon={X}
										label="Hủy bỏ"
										gradient="bg-red-50 hover:bg-red-100"
										labelColor="text-red-700"
										iconColor="text-red-700"
										className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
										roundedFull
										shadow
									/>
									{!createMode && (
										<GradientButton
											onClick={handleBulkSave}
											icon={Save}
											label="Lưu tất cả"
											iconColor="text-white"
											labelColor="text-white"
											// gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
											// hoverGradient="hover:from-yellow-500 hover:to-orange-600"
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
											roundedFull
											shadow
										/>
									)}
								</>
							) : (
								<>
									{!isEditingVariant && (
										<GradientButton
											onClick={() => setMode("generate")}
											icon={Plus}
											label="Thêm biến thể"
											iconColor="text-white"
											labelColor="text-white"
											// gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
											// hoverGradient="hover:from-yellow-500 hover:to-orange-600"
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
											roundedFull
											shadow
										/>
									)}

									{/* <GradientButton
										onClick={() => setIsEditingVariant(!isEditingVariant)}
										icon={Settings2}
										label="Chỉnh sửa"
										iconColor="text-white"
										labelColor="text-white"
										gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
										hoverGradient="hover:from-yellow-500 hover:to-orange-600"
										className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
										roundedFull
										shadow
									/> */}
									{!isEditingVariant ? (
										// --- TRẠNG THÁI 1: HIỆN NÚT CHỈNH SỬA ---
										<GradientButton
											onClick={() => setIsEditingVariant(true)}
											icon={Settings2}
											label="Chỉnh sửa"
											iconColor="text-white"
											labelColor="text-white"
											gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
											hoverGradient="hover:from-yellow-500 hover:to-orange-600"
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
											roundedFull
											shadow
										/>
									) : (
										// --- TRẠNG THÁI 2: HIỆN NÚT TRỞ VỀ (HOÀN TẤT) ---
										<GradientButton
											onClick={() => setIsEditingVariant(false)}
											icon={CheckCheck} // Hoặc dùng icon X nếu muốn mang ý nghĩa "Đóng"
											label="Hoàn tất"
											iconColor="text-white"
											labelColor="text-white"
											gradient="bg-gradient-to-r from-emerald-400 to-teal-500" // Màu xanh tạo cảm giác đã xong/an toàn
											hoverGradient="hover:from-emerald-500 hover:to-teal-600"
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
											roundedFull
											shadow
										/>
									)}
								</>
							)}
						</div>
					)}
				</div>
				{/* NOTE SECTION - Chỉ hiện khi đang Edit/Create */}
				{(isTempTable || isEditingVariant) && (
					<div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex gap-4 items-start animate-in slide-in-from-top-2 duration-300 shadow-sm">
						<div className="p-2 bg-white rounded-full shadow-sm shrink-0 text-indigo-600">
							<Info size={20} strokeWidth={2.5} />
						</div>
						<div className="space-y-1.5">
							<h4 className="text-base font-bold text-indigo-900">
								Hướng dẫn quản lý biến thể
							</h4>
							<div className="text-sm text-indigo-700/80 space-y-1 font-medium">
								<p className="flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
									<span>
										<b>Ảnh biến thể:</b> Tải lên hình ảnh đại diện riêng cho
										từng phân loại (VD: Áo màu đỏ hiển thị ảnh của áo màu đỏ).
									</span>
								</p>
								<p className="flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
									<span>
										<b>Giá điều chỉnh:</b> Nhập số tiền chênh lệch so với giá
										gốc. (VD: Nhập{" "}
										<span className="text-emerald-600 font-bold">+10.000</span>{" "}
										để tăng giá,{" "}
										<span className="text-red-500 font-bold">-5.000</span> để
										giảm giá, và không nhập gì nếu cần không điều chỉnh).
									</span>
								</p>
								<p className="flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
									<span>
										<b>Tồn kho:</b> Đây là số lượng hàng hiện có cho biến thể
										đó.
									</span>
								</p>
							</div>
						</div>
					</div>
				)}
				<Table
					columns={columns}
					data={variantRows}
					showIndex
					rowsPerPage={5}
					sttIconColor="text-indigo-600"
					headerColor="bg-gradient-to-r from-blue-100 via-indigo-200 to-pink-100 text-indigo-600 font-extrabold tracking-wider shadow-md"
					paginationBg="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
					paginationActiveColor="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-white font-semibold shadow-md"
					paginationTextColor="text-indigo-600 font-medium"
					paginationHoverColor="hover:bg-gradient-to-r hover:from-blue-100 hover:via-indigo-150 hover:to-purple-100"
				/>
			</div>
		);
	};

	return (
		<div className="space-y-6 border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
			{mode === "generate" ? renderGeneratorTable() : renderVariantTable()}
		</div>
	);
};
