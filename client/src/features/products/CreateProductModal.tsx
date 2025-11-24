"use client";

import { useForm, FormProvider } from "react-hook-form";
import React, { useState } from "react";
import {
	ProductImageGallery,
	ProductDetailLayout,
	ProductVariantSection,
	ProductInfoSection,
	ProductDescSection,
} from "@shared/features/product";
import {
	useProduct,
	CreateProductWithVariantsRequest,
} from "@shared/features/product";
import { useNotification, buildFormDataForCreateProduct } from "@shared/core";

interface CreateProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	onRefresh: () => void; // Hàm reload danh sách sản phẩm ở cha
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
	isOpen,
	onClose,
	onRefresh,
}) => {
	const { createShopProduct } = useProduct();
	const { showToast } = useNotification();

	// --- Local States ---
	const [isDataChanged, setIsDataChanged] = useState(false); // Theo dõi có thay đổi dữ liệu không để reload khi đóng
	// --- Form ---
	// Lưu ý: 'images' (ảnh SP) và 'variantsPayload' (biến thể) sẽ được các component con update vào form
	const methods = useForm<CreateProductWithVariantsRequest>({
		defaultValues: {
			pdName: "",
			basePrice: 0,
			description: "",
			images: [], // Chứa File[] từ ProductImageGallery
			variantsPayload: [], // Chứa danh sách biến thể từ ProductVariantSection
			targetGroup: "full_body", // Mặc định targetGroup là 'full_body'
		},
		mode: "onSubmit",
	});

	const onSubmit = async (data: CreateProductWithVariantsRequest) => {
		// console.log("Creating Product with Data:", data);
		if (!data.variantsPayload || data.variantsPayload.length === 0) {
			showToast("Vui lòng tạo ít nhất một biến thể cho sản phẩm.", "error");
			return; // Dừng hàm lại, không gửi API
		}
		// 1. Build FormData chuẩn (sử dụng util đã có)
		// Lưu ý: buildFormDataForCreateProduct đã xử lý việc map fileKey cho variant
		const formData = buildFormDataForCreateProduct(data);

		// 2. Gọi API
		const res = await createShopProduct(formData);

		if (res.success) {
			setIsDataChanged(true);
			onRefresh(); // Reload list bên ngoài
			onClose(); // Đóng modal
			methods.reset(); // Reset form về rỗng
		}
	};

	const FORM_ID = "product-create-form";
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
							productId={undefined}
							createMode={true}
							width="w-full"
							height="aspect-square"
						/>
					}
					// --- DIV 2: THÔNG TIN CƠ BẢN (Header) ---
					headerContent={
						<ProductInfoSection // Truyền formId xuống để nút Lưu trong Div 2 có thể submit form
							formId={FORM_ID}
							product={null} // Dữ liệu gốc để hiển thị View Mode
							isShop={true}
							isAdmin={true}
							mode={"create"}
						/>
					}
					// --- DIV 3: MÔ TẢ (Detail) ---
					detailContent={
						<ProductDescSection isShop={true} currentMode={"create"} />
					}
					// --- DIV 4: VARIANTS (Footer) ---
					footerContent={
						<div className="pt-6 border-t border-gray-100">
							{/* Truyền product detail vào để hiển thị bảng biến thể */}
							<ProductVariantSection
								product={null}
								isShop={true}
								createMode={true}
							/>
						</div>
					}
				/>
			</form>
		</FormProvider>
	);
};
