"use client";

import { useForm, FormProvider } from "react-hook-form";
import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import {
	ProductDetail,
	Product,
	ProductImageGallery,
	ProductDetailLayout,
} from "@shared/features/product";
// Import Hook & Utils
import {
	useProduct,
	ProductInfoSection,
	ProductDescSection,
} from "@shared/features/product";
import { useNotification } from "@shared/core";

interface SellerProductDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: Product | null;
	onRefresh: () => void; // Hàm reload dữ liệu của cha
}

export const SellerProductDetailModal: React.FC<
	SellerProductDetailModalProps
> = ({ isOpen, onClose, product, onRefresh }) => {
	// --- Hooks ---
	const { updateShopProductBasic, getProductDetail } = useProduct();

	// --- Local States ---
	const [localProduct, setLocalProduct] = useState<ProductDetail | null>(null); // Dữ liệu chi tiết đầy đủ
	const [isDataChanged, setIsDataChanged] = useState(false); // Theo dõi có thay đổi dữ liệu không để reload khi đóng
	const [isEditing, setIsEditing] = useState(false); // Trạng thái chỉnh sửa chung cho cả Div 2 và Div 3

	// --- Form ---
	const methods = useForm({
		defaultValues: {
			pdName: "",
			basePrice: 0,
			description: "",
		},
		mode: "onSubmit", // Validate khi submit
	});
	// --- 1. FETCH PRODUCT DETAIL ---
	// Hàm này dùng để lấy dữ liệu mới nhất từ server
	const fetchDetail = useCallback(async () => {
		if (!product?._id) return;
		const res = await getProductDetail(product._id);
		if (res.success && res.data) {
			setLocalProduct(res.data); // Cập nhật state nội bộ

			// Reset form theo dữ liệu mới nhất vừa lấy về
			methods.reset({
				pdName: res.data.pdName,
				basePrice: res.data.basePrice,
				description: res.data.description || "",
			});
		}
	}, [product?._id, getProductDetail, methods]);

	// Gọi fetchDetail khi mở modal
	useEffect(() => {
		if (isOpen && product) {
			fetchDetail();
			setIsEditing(false);
			setIsDataChanged(false);
			console.log("Opened modal for product:", product);
		} else {
			setLocalProduct(null); // Clear khi đóng
		}
	}, [isOpen, product, fetchDetail]);

	// --- Handlers ---

	const onSubmit = async (data: any) => {
		if (!localProduct) return; // Dùng localProduct thay vì product prop
		console.log("Submitting edit with data:", localProduct);
		const payload = {
			pdName: data.pdName,
			basePrice: Number(data.basePrice),
			description: data.description,
		};

		const res = await updateShopProductBasic(localProduct._id, payload);

		if (res.success) {
			setIsEditing(false);
			setIsDataChanged(true);
			await fetchDetail();

			// Gọi onRefresh để cập nhật list bên ngoài (nhưng list bên ngoài không ảnh hưởng giao diện modal đang mở nữa)
			onRefresh();
		}
	};

	const handleEditClick = () => setIsEditing(true);

	const handleCancelEdit = () => {
		setIsEditing(false);
		// Reset form về giá trị của localProduct hiện tại
		if (localProduct) {
			methods.reset({
				pdName: localProduct.pdName,
				basePrice: localProduct.basePrice,
				description: localProduct.description || "",
			});
		}
	};

	// const handleVariantClick = () => console.log("Variant click");

	// Xử lý sự kiện ảnh thay đổi
	const handleImageUpdated = async () => {
		setIsDataChanged(true);
		await fetchDetail(); // Reload lại data để lấy danh sách ảnh mới
		onRefresh();
	};

	if (!product) return null; // Check product prop để đảm bảo an toàn ban đầu

	const displayProduct = localProduct || product;
	const shopInfo =
		typeof displayProduct.shopId === "object" && displayProduct.shopId !== null
			? displayProduct.shopId
			: null;
	const FORM_ID = "product-edit-form";
	return (
		<FormProvider {...methods}>
			<form
				id={FORM_ID}
				onSubmit={methods.handleSubmit(onSubmit)}
				className="contents">
				<ProductDetailLayout
					isModal={true}
					isOpen={isOpen}
					onClose={onClose}
					hasUpdated={isDataChanged}
					onRefresh={onRefresh}
					// Cấu hình Layout
					modalWidth="w-full max-w-5xl"
					imageWidth="w-full md:w-[400px]"
					// --- DIV 1: ẢNH ---
					imageContent={
						<ProductImageGallery
							productId={displayProduct._id}
							mode="shop" // Hiện nút sửa ảnh
							width="w-full"
							height="aspect-square"
							onImagesUpdated={handleImageUpdated} // Đánh dấu đã thay đổi ảnh
						/>
					}
					// --- DIV 2: THÔNG TIN CƠ BẢN (Header) ---
					headerContent={
						<ProductInfoSection
							formId={FORM_ID} // Truyền formId xuống để nút Lưu trong Div 2 có thể submit form
							product={displayProduct as any} // Dữ liệu gốc để hiển thị View Mode
							isShop={true}
							mode={isEditing ? "edit" : "view"}
							onEditClick={handleEditClick}
							// onVariantClick={handleVariantClick}
							onCancelEdit={handleCancelEdit}
						/>
					}
					// --- DIV 3: MÔ TẢ (Detail) ---
					detailContent={
						<ProductDescSection
							shopInfo={shopInfo}
							// isShop={true}
							currentMode={isEditing ? "edit" : "view"}
						/>
					}
				/>
			</form>
		</FormProvider>
	);
};
