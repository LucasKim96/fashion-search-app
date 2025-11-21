"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { ProductDetailLayout } from "@shared/features/product/components/ProductDetailLayout"; // Đường dẫn tới file Layout bạn gửi
import { ProductImageGallery } from "@shared/features/product/components/ProductImageGallery"; // Đường dẫn tới file Gallery bạn gửi
import { ProductInfoSection } from "@shared/features/product/components/ProductInfoSection"; // Đường dẫn tới file Info bạn gửi
import { ProductDetail } from "@shared/features/product/product.types"; // Import đúng Type

interface ProductDetailClientProps {
	product: ProductDetail; // Nhận dữ liệu từ Server Component truyền xuống
}

export default function ProductDetailClient({
	product,
}: ProductDetailClientProps) {
	// 1. Cần khởi tạo FormProvider vì ProductInfoSection có sử dụng useFormContext
	// Dù ở chế độ "view" (xem), nó vẫn cần context để không bị lỗi crash app.
	const methods = useForm({
		defaultValues: {
			pdName: product.pdName,
			basePrice: product.basePrice,
			description: product.description,
			// ... map thêm các field khác nếu cần
		},
	});

	// 2. Component hiển thị mô tả (HTML)
	const DescriptionSection = () => {
		if (!product.description) return null;
		return (
			<div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
				<h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
					Mô tả chi tiết
				</h3>
				<div
					className="prose prose-indigo max-w-none text-gray-600"
					dangerouslySetInnerHTML={{ __html: product.description }}
				/>
			</div>
		);
	};

	// 3. Component hiển thị sản phẩm liên quan (Footer) - Tùy chọn
	const RelatedProducts = () => (
		<div className="py-4 text-center text-gray-400 italic">
			{/* Bạn có thể map list ProductCard vào đây sau này */}
			--- Có thể bạn cũng thích (Sản phẩm liên quan) ---
		</div>
	);

	return (
		// Bọc FormProvider ra ngoài cùng
		<FormProvider {...methods}>
			<div className="bg-gray-50 min-h-screen py-8 px-4">
				<div className="max-w-7xl mx-auto">
					{/* GỌI LAYOUT THẦN THÁNH CỦA BẠN */}
					<ProductDetailLayout
						// Không phải modal, đây là trang full
						isModal={false}
						// 1. Cột Trái: Ảnh
						// Gallery của bạn tự fetch lại data dựa vào productId,
						// hoặc bạn có thể sửa Gallery để nhận props `images` trực tiếp cho nhanh.
						// Ở đây mình dùng productId để nó tự xử lý theo logic cũ của bạn.
						imageContent={
							<ProductImageGallery
								productId={product._id}
								mode="client"
								width="w-full"
							/>
						}
						// 2. Cột Phải: Thông tin (Tên, Giá,...)
						headerContent={
							<ProductInfoSection
								product={product}
								mode="view" // Chỉ xem, không sửa
								isShop={false} // Giao diện khách hàng
							/>
						}
						// 3. Bên dưới: Mô tả
						detailContent={<DescriptionSection />}
					/>
				</div>
			</div>
		</FormProvider>
	);
}
