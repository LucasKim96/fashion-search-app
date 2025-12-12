"use client";

import { useForm, FormProvider } from "react-hook-form";
import React, { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";
import {
	ProductDetail,
	Product,
	ProductImageGallery,
	ProductDetailLayout,
	ProductVariantSection,
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
	const { getProductDetail } = useProduct();
	// --- Local States ---
	const [localProduct, setLocalProduct] = useState<ProductDetail | null>(null); // Dữ liệu chi tiết đầy đủ
	const [isDataChanged, setIsDataChanged] = useState(false); // Theo dõi có thay đổi dữ liệu không để reload khi đóng
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
			methods.reset({
				pdName: res.data.pdName,
				basePrice: res.data.basePrice,
				description: res.data.description || "",
			});
			// console.log("---Fetched product detail:", res.data);
		}
	}, [product?._id, getProductDetail]);

	// Gọi fetchDetail khi mở modal
	useEffect(() => {
		const load = async () => {
			if (isOpen && product) {
				await fetchDetail();
				setIsDataChanged(false);
			} else {
				setLocalProduct(null); // Clear khi đóng
			}
		};
		load();
	}, [isOpen, product, fetchDetail]);

	if (!product) return null; // Check product prop để đảm bảo an toàn ban đầu

	const displayProduct = localProduct || product;
	const shopInfo =
		typeof displayProduct.shopId === "object" && displayProduct.shopId !== null
			? displayProduct.shopId
			: null;
	const FORM_ID = "product-edit-form";
	return (
		<FormProvider {...methods}>
			<form id={FORM_ID} className="contents">
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
							width="w-full"
							height="aspect-square"
						/>
					}
					// --- DIV 2: THÔNG TIN CƠ BẢN (Header) ---
					headerContent={
						<ProductInfoSection // Truyền formId xuống để nút Lưu trong Div 2 có thể submit form
							formId={FORM_ID}
							product={displayProduct as any} // Dữ liệu gốc để hiển thị View Mode
							isShop={false}
							isAdmin={true}
							mode={"view"}
						/>
					}
					// --- DIV 3: MÔ TẢ (Detail) ---
					detailContent={
						<ProductDescSection
							shopInfo={shopInfo}
							isShop={false}
							isAdmin={true}
							currentMode={"view"}
						/>
					}
					// --- DIV 4: VARIANTS (Footer) ---
					footerContent={
						<div className="pt-6 border-t border-gray-100">
							{/* Truyền product detail vào để hiển thị bảng biến thể */}
							<ProductVariantSection
								product={localProduct as ProductDetail}
								isShop={false}
							/>
						</div>
					}
				/>
			</form>
		</FormProvider>
	);
};
