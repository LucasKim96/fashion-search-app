"use client";

import React, { useMemo } from "react";
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
								/>
							}
							// Cột Phải: Thông tin
							headerContent={
								<ProductInfoSection
									product={product}
									mode="view"
									isShop={false}
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
