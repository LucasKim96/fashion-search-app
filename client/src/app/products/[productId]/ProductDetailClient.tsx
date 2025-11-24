"use client";

import React, { useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";

import { ProductDetailLayout } from "@shared/features/product/components/ProductDetailLayout";
import { ProductImageGallery } from "@shared/features/product/components/ProductImageGallery";
import { ProductInfoSection } from "@shared/features/product/components/ProductInfoSection";
import { ProductDescSection } from "@shared/features/product/components/ProductDescSection";
import { AddToCartModal } from "@/components/modals/AddToCartModal";

import {
	ProductDetail,
	ProductDetailShopInfo,
	ProductVariantDetail,
} from "@shared/features/product/product.types";
import { useAuth } from "@shared/features/auth";
import { useCart } from "@shared/features/cart/useCart.hook";
import { useNotification } from "@shared/core/ui/NotificationProvider";

import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

interface ProductDetailClientProps {
	product: ProductDetail;
}

export default function ProductDetailClient({
	product,
}: ProductDetailClientProps) {
	const router = useRouter();
	const { isAuthenticated } = useAuth();

	// 1. SỬA: Lấy đúng tên hàm addItemToCart từ useCart
	const { addItemToCart } = useCart();

	// 2. SỬA: Lấy showToast từ useNotification (thay vì notifySuccess...)
	const { showToast } = useNotification();

	// Khởi tạo Form
	const methods = useForm({
		defaultValues: {
			pdName: product.pdName,
			basePrice: product.basePrice,
			description: product.description,
		},
	});

	// XỬ LÝ SHOP INFO
	const shopInfo = useMemo(() => {
		const rawShop = product.shopId;
		if (rawShop && typeof rawShop === "object" && "_id" in rawShop) {
			const s = rawShop as ProductDetailShopInfo;
			return {
				_id: s._id,
				shopName: s.shopName,
				logoUrl: s.logoUrl,
				isOnline: s.isOnline,
				lastActiveText: s.lastActiveText || "Vừa truy cập",
			};
		}
		return null;
	}, [product.shopId]);

	// State quản lý
	const [selectedVariantImage, setSelectedVariantImage] = useState<
		string | null
	>(null);
	const [selectedVariantPrice, setSelectedVariantPrice] = useState<
		number | null
	>(null);
	const [selectedVariant, setSelectedVariant] =
		useState<ProductVariantDetail | null>(null);
	const [isCartModalOpen, setIsCartModalOpen] = useState(false);

	// --- HÀM XỬ LÝ KHI CHỌN BIẾN THỂ ---
	const handleVariantSelect = (variant: any) => {
		if (variant) {
			// QUAN TRỌNG: Phải lưu variant vào state để dùng khi Add to Cart
			setSelectedVariant(variant);

			// Cập nhật ảnh
			if (variant.image) {
				setSelectedVariantImage(variant.image);
			}
			// Cập nhật giá
			if (variant.priceAdjustment !== undefined) {
				setSelectedVariantPrice(product.basePrice + variant.priceAdjustment);
			} else {
				setSelectedVariantPrice(product.basePrice);
			}
		} else {
			// Reset
			setSelectedVariant(null);
			setSelectedVariantImage(null);
			setSelectedVariantPrice(null);
		}
	};

	// --- XỬ LÝ CLICK NÚT "THÊM VÀO GIỎ" ---
	const handleAddToCartClick = () => {
		// 1. Kiểm tra đăng nhập
		if (!isAuthenticated) {
			showToast("Vui lòng đăng nhập để mua hàng", "info");
			router.push("/login");
			return;
		}

		// 2. Kiểm tra biến thể
		if (product.variants && product.variants.length > 0 && !selectedVariant) {
			showToast("Vui lòng chọn đầy đủ phân loại sản phẩm", "error");
			return;
		}

		// 3. Mở Modal
		setIsCartModalOpen(true);
	};

	// --- XỬ LÝ XÁC NHẬN TRONG MODAL ---
	const handleConfirmAddToCart = async (quantity: number) => {
		try {
			// SỬA: Gọi đúng hàm addItemToCart
			// Lưu ý: Cấu trúc payload phải khớp với AddToCartRequest trong cart.types.ts
			const res = await addItemToCart({
				productVariantId: selectedVariant?._id || "",
				quantity: quantity,
				// Nếu API yêu cầu productId khi không có variant, bạn có thể cần thêm:
				// productId: product._id
			});

			if (res.success) {
				// Hook useCart có thể đã toast lỗi, nhưng toast success thường làm ở UI
				showToast("Đã thêm vào giỏ hàng thành công!", "success");
			}
			// Không cần else showToast error vì hook useCart đã làm rồi
		} catch (error) {
			// showToast("Lỗi kết nối", "error"); // Hook useCart cũng đã catch lỗi này
		}
	};

	const displayProduct = useMemo(() => {
		if (selectedVariantPrice !== null) {
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
							imageContent={
								<ProductImageGallery
									productId={product._id}
									mode="client"
									width="w-full"
									activeImage={selectedVariantImage}
								/>
							}
							headerContent={
								<ProductInfoSection
									product={displayProduct}
									mode="view"
									isShop={false}
									onVariantSelect={handleVariantSelect}
									// Bổ sung các props cần thiết cho nút Mua
									currentStock={selectedVariant ? selectedVariant.stock : null}
									onAddToCart={handleAddToCartClick}
								/>
							}
							detailContent={
								<ProductDescSection
									currentMode="view"
									isShop={false}
									shopInfo={shopInfo}
								/>
							}
						/>
					</div>
				</main>

				<ClientFooter />

				<AddToCartModal
					isOpen={isCartModalOpen}
					onClose={() => setIsCartModalOpen(false)}
					product={product}
					selectedVariant={selectedVariant}
					onConfirm={handleConfirmAddToCart}
				/>
			</div>
		</FormProvider>
	);
}
