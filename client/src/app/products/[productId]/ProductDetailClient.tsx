// "use client";

// import React, { useMemo, useState } from "react";
// import { useForm, FormProvider } from "react-hook-form";
// import { useRouter } from "next/navigation";

// import { ProductDetailLayout } from "@shared/features/product/components/ProductDetailLayout";
// import { ProductImageGallery } from "@shared/features/product/components/ProductImageGallery";
// import { ProductInfoSection } from "@shared/features/product/components/ProductInfoSection";
// import { ProductDescSection } from "@shared/features/product/components/ProductDescSection";
// import { AddToCartModal } from "@/components/modals/AddToCartModal";

// import {
// 	ProductDetail,
// 	ProductDetailShopInfo,
// 	ProductVariantDetail,
// } from "@shared/features/product/product.types";
// import { useAuth } from "@shared/features/auth";
// import { useCart } from "@shared/features/cart/useCart.hook";
// import { useNotification } from "@shared/core";

// import ClientHeader from "@/components/layouts/ClientHeader";
// import ClientFooter from "@/components/layouts/ClientFooter";

// interface ProductDetailClientProps {
// 	product: ProductDetail;
// }

// export default function ProductDetailClient({
// 	product,
// }: ProductDetailClientProps) {
// 	const router = useRouter();
// 	const { isAuthenticated, user } = useAuth();
// 	const { addToCart } = useCart();
// 	const { notifySuccess, notifyError } = useNotification();

// 	// 1. Khởi tạo Form
// 	const methods = useForm({
// 		defaultValues: {
// 			pdName: product.pdName,
// 			basePrice: product.basePrice,
// 			description: product.description,
// 		},
// 	});

// 	// 2. XỬ LÝ SHOP INFO (Dùng useMemo để tính toán ngay lập tức, không chờ useEffect)
// 	const shopInfo = useMemo(() => {
// 		const rawShop = product.shopId;
// 		// Kiểm tra nếu rawShop là object và có _id (Tức là đã populate)
// 		if (rawShop && typeof rawShop === "object" && "_id" in rawShop) {
// 			// Ép kiểu sang ProductDetailShopInfo để TypeScript không báo lỗi
// 			const s = rawShop as ProductDetailShopInfo;

// 			return {
// 				_id: s._id,
// 				shopName: s.shopName,
// 				logoUrl: s.logoUrl,
// 				isOnline: s.isOnline,
// 				lastActiveText: s.lastActiveText || "Vừa truy cập",
// 			};
// 		}
// 		// Trường hợp backend trả về string (đề phòng), trả về null để ẩn phần shop đi
// 		return null;
// 	}, [product.shopId]);

// 	const [selectedVariantImage, setSelectedVariantImage] = useState<
// 		string | null
// 	>(null);
// 	const [selectedVariantPrice, setSelectedVariantPrice] = useState<
// 		number | null
// 	>(null);
// 	const [selectedVariant, setSelectedVariant] =
// 		useState<ProductVariantDetail | null>(null);
// 	const [isCartModalOpen, setIsCartModalOpen] = useState(false);

// 	// --- BỔ SUNG: Hàm xử lý khi ProductInfoSection báo lên ---
// 	const handleVariantSelect = (variant: any) => {
// 		if (variant) {
// 			// Nếu tìm thấy biến thể khớp
// 			// 1. Cập nhật ảnh
// 			if (variant.image) {
// 				setSelectedVariantImage(variant.image);
// 			}
// 			// 2. Cập nhật giá (nếu biến thể có giá khác - logic priceAdjustment)
// 			// Giả sử priceAdjustment là số tiền cộng thêm/trừ đi
// 			if (variant.priceAdjustment !== undefined) {
// 				setSelectedVariantPrice(product.basePrice + variant.priceAdjustment);
// 			} else {
// 				setSelectedVariantPrice(product.basePrice);
// 			}
// 		} else {
// 			// Nếu user bỏ chọn hoặc chọn chưa đủ -> Reset về mặc định
// 			setSelectedVariantImage(null);
// 			setSelectedVariantPrice(null);
// 		}
// 	};

// 	// --- XỬ LÝ CLICK NÚT "THÊM VÀO GIỎ" ---
// 	const handleAddToCartClick = () => {
// 		// 1. Kiểm tra đăng nhập
// 		if (!isAuthenticated) {
// 			// Nếu là khách -> Chuyển trang login hoặc báo lỗi (theo yêu cầu là "ko hiện modal")
// 			showToast("Vui lòng đăng nhập để mua hàng", "info");
// 			router.push("/login");
// 			return;
// 		}

// 		// 2. Kiểm tra đã chọn biến thể chưa (nếu sản phẩm có biến thể)
// 		if (product.variants && product.variants.length > 0 && !selectedVariant) {
// 			showToast("Vui lòng chọn đầy đủ phân loại sản phẩm", "warning");
// 			return;
// 		}

// 		// 3. Mở Modal
// 		setIsCartModalOpen(true);
// 	};

// 	// --- XỬ LÝ XÁC NHẬN TRONG MODAL ---
// 	const handleConfirmAddToCart = async (quantity: number) => {
// 		try {
// 			// Gọi API thêm vào giỏ hàng
// 			// Logic này phụ thuộc vào hook useCart của bạn
// 			// Thường cần: productId, variantId (nếu có), quantity
// 			const res = await addToCart({
// 				productVariantId: selectedVariant?._id, // Hoặc ID sản phẩm gốc nếu ko có variant
// 				quantity: quantity,
// 			});

// 			if (res.success) {
// 				showToast("Đã thêm vào giỏ hàng thành công!", "success");
// 			} else {
// 				showToast(res.message || "Có lỗi xảy ra", "error");
// 			}
// 		} catch (error) {
// 			showToast("Lỗi kết nối", "error");
// 		}
// 	};

// 	const displayProduct = useMemo(() => {
// 		if (selectedVariantPrice !== null) {
// 			// Clone product và đè lại giá mới
// 			return { ...product, basePrice: selectedVariantPrice };
// 		}
// 		return product;
// 	}, [product, selectedVariantPrice]);

// 	return (
// 		<FormProvider {...methods}>
// 			<div className="flex flex-col min-h-screen bg-gray-50">
// 				<ClientHeader />

// 				<main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
// 					<div className="max-w-7xl mx-auto">
// 						<ProductDetailLayout
// 							isModal={false}
// 							// Cột Trái: Ảnh
// 							imageContent={
// 								<ProductImageGallery
// 									productId={product._id}
// 									mode="client"
// 									width="w-full"
// 									activeImage={selectedVariantImage}
// 								/>
// 							}
// 							// Cột Phải: Thông tin
// 							headerContent={
// 								<ProductInfoSection
// 									product={displayProduct}
// 									mode="view"
// 									isShop={false}
// 									onVariantSelect={handleVariantSelect}
// 									currentStock={selectedVariant ? selectedVariant.stock : null}
// 									onAddToCart={handleAddToCartClick}
// 								/>
// 							}
// 							// Bên dưới: Shop + Mô tả
// 							detailContent={
// 								<ProductDescSection
// 									currentMode="view"
// 									isShop={false}
// 									shopInfo={shopInfo} // Truyền biến shopInfo đã tính toán ở trên
// 								/>
// 							}
// 							// footerContent={<RelatedProducts />}
// 						/>
// 					</div>
// 				</main>

// 				<ClientFooter />
// 				<AddToCartModal
// 					isOpen={isCartModalOpen}
// 					onClose={() => setIsCartModalOpen(false)}
// 					product={product}
// 					selectedVariant={selectedVariant}
// 					onConfirm={handleConfirmAddToCart}
// 				/>
// 			</div>
// 		</FormProvider>
// 	);
// }

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
import { useCart } from "@shared/features/cart/useCart.hook"; // Đảm bảo đường dẫn đúng
import { useNotification } from "@shared/core";

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
