"use client";

import React, { useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { ProductDetailLayout } from "@shared/features/product/components/ProductDetailLayout";
import { ProductImageGallery } from "@shared/features/product/components/ProductImageGallery";
import { ProductInfoSection } from "@shared/features/product/components/ProductInfoSection";
import { ProductDescSection } from "@shared/features/product/components/ProductDescSection";
import {
	ProductDetail,
	ProductDetailShopInfo,
} from "@shared/features/product/product.types";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

interface ProductDetailClientProps {
	product: ProductDetail;
}

export default function ProductDetailClient({
	product,
}: ProductDetailClientProps) {
	// 1. Khởi tạo Form
	const methods = useForm({
		defaultValues: {
			pdName: product.pdName,
			basePrice: product.basePrice,
			description: product.description,
		},
	});

	// 2. XỬ LÝ SHOP INFO (Dùng useMemo để tính toán ngay lập tức, không chờ useEffect)
	const shopInfo = useMemo(() => {
		const rawShop = product.shopId;

		// Log để kiểm tra lần nữa nếu cần
		// console.log("Raw Shop Data:", rawShop);

		// Kiểm tra nếu rawShop là object và có _id (Tức là đã populate)
		if (rawShop && typeof rawShop === "object" && "_id" in rawShop) {
			// Ép kiểu sang ProductDetailShopInfo để TypeScript không báo lỗi
			const s = rawShop as ProductDetailShopInfo;

			return {
				_id: s._id,
				shopName: s.shopName, // Log của bạn báo key là 'shopName', rất tốt!
				logoUrl: s.logoUrl, // Log báo key là 'logoUrl'
				isOnline: s.isOnline,
				lastActiveText: s.lastActiveText || "Vừa truy cập", // Fallback nếu null
			};
		}

		// Trường hợp backend trả về string (đề phòng), trả về null để ẩn phần shop đi
		return null;
	}, [product.shopId]);

	// 3. Phần Footer (Static)
	const RelatedProducts = () => (
		<div className="py-8 border-t border-gray-100 mt-8 text-center text-gray-400 italic">
			Sản phẩm liên quan sẽ hiển thị ở đây
		</div>
	);

	const [selectedVariantImage, setSelectedVariantImage] = useState<
		string | null
	>(null);
	// Có thể lưu thêm selectedVariantPrice nếu muốn đổi giá tiền khi chọn variant
	const [selectedVariantPrice, setSelectedVariantPrice] = useState<
		number | null
	>(null);

	// --- BỔ SUNG: Hàm xử lý khi ProductInfoSection báo lên ---
	const handleVariantSelect = (variant: any) => {
		if (variant) {
			// Nếu tìm thấy biến thể khớp
			// 1. Cập nhật ảnh
			if (variant.image) {
				setSelectedVariantImage(variant.image);
			}
			// 2. Cập nhật giá (nếu biến thể có giá khác - logic priceAdjustment)
			// Giả sử priceAdjustment là số tiền cộng thêm/trừ đi
			if (variant.priceAdjustment !== undefined) {
				setSelectedVariantPrice(product.basePrice + variant.priceAdjustment);
			} else {
				setSelectedVariantPrice(product.basePrice);
			}
		} else {
			// Nếu user bỏ chọn hoặc chọn chưa đủ -> Reset về mặc định
			setSelectedVariantImage(null);
			setSelectedVariantPrice(null);
		}
	};

	const displayProduct = useMemo(() => {
		if (selectedVariantPrice !== null) {
			// Clone product và đè lại giá mới
			return { ...product, basePrice: selectedVariantPrice };
		}
		return product;
	}, [product, selectedVariantPrice]);

	return (
		<FormProvider {...methods}>
			<div className="flex flex-col min-h-screen bg-gray-50">
				<ClientHeader />

				<main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
					<div className="max-w-7xl mx-auto">
						<ProductDetailLayout
							isModal={false}
							// Cột Trái: Ảnh
							imageContent={
								<ProductImageGallery
									productId={product._id}
									mode="client"
									width="w-full"
									activeImage={selectedVariantImage}
								/>
							}
							// Cột Phải: Thông tin
							headerContent={
								<ProductInfoSection
									product={displayProduct}
									mode="view"
									isShop={false}
									onVariantSelect={handleVariantSelect}
								/>
							}
							// Bên dưới: Shop + Mô tả
							detailContent={
								<ProductDescSection
									currentMode="view"
									isShop={false}
									shopInfo={shopInfo} // Truyền biến shopInfo đã tính toán ở trên
								/>
							}
							footerContent={<RelatedProducts />}
						/>
					</div>
				</main>

				<ClientFooter />
			</div>
		</FormProvider>
	);
}
