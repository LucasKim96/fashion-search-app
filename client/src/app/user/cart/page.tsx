"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
// 1. IMPORT AUTH & NOTIFICATION
import { useAuth } from "@shared/features/auth";
import { useNotification } from "@shared/core/ui/NotificationProvider";

import { useCart } from "@shared/features/cart/useCart.hook";
import { buildImageUrl, formatCurrency } from "@shared/core/utils";
import { Loader2, Trash2, ShoppingBag, Plus, Minus, Store } from "lucide-react";
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback";

// --- COMPONENT: Giỏ hàng trống ---
const EmptyCart = () => {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl shadow-md">
			<ShoppingBag className="w-20 h-20 text-gray-300 mb-4" strokeWidth={1} />
			<h2 className="text-2xl font-semibold text-gray-700 mb-2">
				Giỏ hàng của bạn đang trống
			</h2>
			<button
				onClick={() => router.push("/")}
				className="mt-4 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors shadow-lg">
				Bắt đầu mua sắm
			</button>
		</div>
	);
};

// --- COMPONENT: Skeleton Loading ---
const CartLoadingSkeleton = () => {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
			<div className="lg:col-span-2 space-y-4">
				{[1, 2].map((i) => (
					<div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
				))}
			</div>
			<div className="lg:col-span-1 h-64 bg-gray-200 rounded-lg"></div>
		</div>
	);
};

// --- COMPONENT: Dòng sản phẩm ---
const CartItemRow = ({ item, onUpdateQuantity, onRemove }: any) => {
	const [quantity, setQuantity] = useState(item.quantity);
	const [isUpdating, setIsUpdating] = useState(false);

	// Debounce cập nhật số lượng sau 500ms
	useEffect(() => {
		const handler = setTimeout(async () => {
			if (quantity !== item.quantity && quantity > 0) {
				setIsUpdating(true);
				await onUpdateQuantity(item.productVariantId, quantity);
				setIsUpdating(false);
			}
		}, 500);
		return () => clearTimeout(handler);
	}, [quantity, item.quantity, item.productVariantId, onUpdateQuantity]);

	const displayImage =
		item.productVariant?.image ||
		item.productVariant?.imageUrl ||
		item.product?.images?.[0] ||
		"";

	const displayName = item.product?.pdName || item.product?.name || "Sản phẩm";
	return (
		<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-gray-100 last:border-0">
			{/* Ảnh */}
			<div className="w-24 h-24 flex-shrink-0 relative bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
				<ImageWithFallback
					src={displayImage}
					alt={displayName}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Thông tin */}
			<div className="flex-1">
				<h3 className="font-semibold text-gray-800 text-base">{displayName}</h3>
				<div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
					{item.productVariant?.attributes?.map((attr: any, index: number) => {
						const label = attr.attributeLabel || attr.attribute || "Thuộc tính";
						const value = attr.valueLabel || attr.value || "";
						if (!value) return null;
						return (
							<span
								key={index}
								className="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200 whitespace-nowrap">
								{label}:{" "}
								<span className="font-medium text-gray-700">{value}</span>
							</span>
						);
					})}
				</div>
				<p className="text-sm font-bold text-primary mt-2">
					{formatCurrency(item.price)}
				</p>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-4 mt-4 sm:mt-0">
				<div className="flex items-center border border-gray-300 rounded-full h-9 bg-white shadow-sm">
					<button
						onClick={() => quantity > 1 && setQuantity(quantity - 1)}
						className="px-3 text-gray-600 hover:text-primary disabled:opacity-30 h-full flex items-center"
						disabled={quantity <= 1 || isUpdating}>
						<Minus size={14} />
					</button>
					<span className="w-8 text-center font-bold text-sm text-gray-800">
						{isUpdating ? (
							<Loader2 className="animate-spin mx-auto" size={14} />
						) : (
							quantity
						)}
					</span>
					<button
						onClick={() => setQuantity(quantity + 1)}
						className="px-3 text-gray-600 hover:text-primary disabled:opacity-30 h-full flex items-center"
						disabled={isUpdating}>
						<Plus size={14} />
					</button>
				</div>
				<div className="w-24 text-right hidden sm:block">
					<p className="font-bold text-gray-900 text-sm">
						{formatCurrency(item.price * quantity)}
					</p>
				</div>
				<button
					onClick={() => onRemove(item.productVariantId)}
					className="text-gray-400 hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50">
					<Trash2 size={18} />
				</button>
			</div>
		</div>
	);
};

// --- COMPONENT: Tổng tiền ---
const CartSummary = ({ subtotal }: { subtotal: number }) => {
	const router = useRouter();
	const shippingCost = 0;

	return (
		<div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
			<h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">
				Tóm tắt đơn hàng
			</h2>
			<div className="space-y-3 text-gray-600">
				<div className="flex justify-between">
					<span>Tạm tính</span>
					<span className="font-medium text-gray-800">
						{formatCurrency(subtotal)}
					</span>
				</div>
				<div className="flex justify-between">
					<span>Phí vận chuyển</span>
					<span className="font-medium text-gray-800">
						{formatCurrency(shippingCost)}
					</span>
				</div>
				<div className="flex justify-between border-t pt-4 mt-4">
					<span className="font-semibold text-lg text-gray-800">Tổng cộng</span>
					<span className="font-semibold text-lg text-primary">
						{formatCurrency(subtotal + shippingCost)}
					</span>
				</div>
			</div>
			<button
				onClick={() => router.push("/checkout")}
				className="w-full mt-6 py-3 bg-primary text-white font-bold rounded-full text-lg hover:bg-primary-dark transition-transform hover:scale-105 shadow-xl">
				Tiến hành Thanh toán
			</button>
		</div>
	);
};

// ===================================================================
// MAIN PAGE
// ===================================================================
export default function CartPage() {
	const router = useRouter();

	// 2. LẤY TRẠNG THÁI AUTH
	const { isAuthenticated, loading: authLoading } = useAuth();
	const { showToast } = useNotification();

	const {
		cart,
		loading: cartLoading,
		error,
		updateItemQuantity,
		removeItem,
	} = useCart();

	// 3. CHECK AUTH: Nếu chưa đăng nhập -> Đá về Login
	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			showToast("Vui lòng đăng nhập để xem giỏ hàng", "warning");
			router.push("/login");
		}
	}, [authLoading, isAuthenticated, router, showToast]);

	const groupedItems = useMemo(() => {
		if (!cart?.items?.length) return [];

		const groups: Record<
			string,
			{ shopId: string; shopName: string; items: any[] }
		> = {};

		cart.items.forEach((item) => {
			const rawShop = item.product?.shopId;
			let shopId = "unknown";
			let shopName = "Shop khác";

			if (rawShop && typeof rawShop === "object" && "_id" in rawShop) {
				shopId = (rawShop as any)._id;
				shopName = (rawShop as any).shopName || "Shop";
			} else if (typeof rawShop === "string") {
				shopId = rawShop;
			}

			if (!groups[shopId]) {
				groups[shopId] = { shopId, shopName, items: [] };
			}
			groups[shopId].items.push(item);
		});

		return Object.values(groups);
	}, [cart]);

	// 4. ĐIỀU KIỆN RENDER:
	// Đang check auth HOẶC chưa đăng nhập -> Hiện Skeleton (hoặc null) để ko lộ giỏ hàng
	if (authLoading || !isAuthenticated) return <CartLoadingSkeleton />;

	if (cartLoading) return <CartLoadingSkeleton />;

	if (error)
		return (
			<div className="text-center text-red-500 p-8">
				Lỗi khi tải giỏ hàng: {error}
			</div>
		);

	if (!cart || cart.items.length === 0) return <EmptyCart />;

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold text-gray-800 mb-6">
				Giỏ hàng của bạn
			</h1>
			<div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
				{/* Left: Cart Items grouped by Shop */}
				<div className="lg:col-span-2 space-y-6">
					{groupedItems.map((group) => (
						<div
							key={group.shopId}
							className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
							<div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
								<div className="bg-white p-1.5 rounded-full shadow-sm text-primary border border-gray-200">
									<Store size={18} />
								</div>
								<span
									className="font-bold text-gray-800 hover:text-primary transition-colors cursor-pointer"
									onClick={() => router.push(`/shop/${group.shopId}`)}>
									{group.shopName}
								</span>
							</div>
							<div className="px-6 py-2">
								{group.items.map((item) => (
									<CartItemRow
										key={item.productVariantId}
										item={item}
										onUpdateQuantity={updateItemQuantity}
										onRemove={removeItem}
									/>
								))}
							</div>
						</div>
					))}
				</div>

				{/* Right: Summary */}
				<div className="lg:col-span-1 mt-8 lg:mt-0">
					<CartSummary subtotal={cart.subtotal} />
				</div>
			</div>
		</div>
	);
}
