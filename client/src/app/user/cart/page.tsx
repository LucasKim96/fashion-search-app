"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@shared/features/cart/useCart.hook"; // Giả định bạn có hook này
import { buildImageUrl, formatCurrency } from "@shared/core";
import { Loader2, Trash2, ShoppingBag, Plus, Minus } from "lucide-react";

// ===================================================================
// COMPONENT CON: Hiển thị khi giỏ hàng trống
// ===================================================================
const EmptyCart = () => {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl shadow-md">
			<ShoppingBag className="w-20 h-20 text-gray-300 mb-4" strokeWidth={1} />
			<h2 className="text-2xl font-semibold text-gray-700 mb-2">
				Giỏ hàng của bạn đang trống
			</h2>
			<p className="text-gray-500 mb-6">
				Trông có vẻ bạn chưa thêm sản phẩm nào vào giỏ hàng.
			</p>
			<button
				onClick={() => router.push("/")}
				className="px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors shadow-lg">
				Bắt đầu mua sắm
			</button>
		</div>
	);
};

// ===================================================================
// COMPONENT CON: Hiển thị Skeleton khi đang tải
// ===================================================================
const CartLoadingSkeleton = () => {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
			<div className="lg:col-span-2 space-y-4">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
						<div className="w-24 h-24 bg-gray-200 rounded-md"></div>
						<div className="flex-1 space-y-3">
							<div className="w-3/4 h-5 bg-gray-200 rounded"></div>
							<div className="w-1/4 h-4 bg-gray-200 rounded"></div>
						</div>
						<div className="w-20 h-8 bg-gray-200 rounded-full"></div>
					</div>
				))}
			</div>
			<div className="lg:col-span-1 p-6 bg-white rounded-lg shadow-sm space-y-4">
				<div className="w-1/2 h-6 bg-gray-200 rounded"></div>
				<div className="w-full h-4 bg-gray-200 rounded"></div>
				<div className="w-full h-12 bg-gray-300 rounded-full"></div>
			</div>
		</div>
	);
};

// ===================================================================
// COMPONENT CON: Hiển thị một sản phẩm trong giỏ hàng
// ===================================================================
const CartItemRow = ({ item, onUpdateQuantity, onRemove }) => {
	const [quantity, setQuantity] = useState(item.quantity);
	const [isUpdating, setIsUpdating] = useState(false);

	// Debounce: Chỉ gọi API sau khi người dùng ngừng gõ/nhấn 500ms
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

	const handleQuantityChange = (newQuantity: number) => {
		if (newQuantity > 0) {
			setQuantity(newQuantity);
		}
	};

	return (
		<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
			<img
				src={
					buildImageUrl(item.productVariant?.imageUrl) ||
					"/placeholder-image.jpg"
				}
				alt={item.product?.name}
				className="w-24 h-24 object-cover rounded-lg border border-gray-200 flex-shrink-0"
			/>
			<div className="flex-1">
				<h3 className="font-semibold text-gray-800">{item.product?.name}</h3>
				<p className="text-sm text-gray-500">
					{/* Hiển thị các thuộc tính của variant */}
					{item.productVariant?.attributes
						?.map((attr) => `${attr.attribute}: ${attr.value}`)
						.join(" / ")}
				</p>
				<p className="text-sm font-medium text-primary mt-1">
					{formatCurrency(item.price)}
				</p>
			</div>
			<div className="flex items-center gap-4">
				{/* Quantity Selector */}
				<div className="flex items-center border border-gray-300 rounded-full">
					<button
						onClick={() => handleQuantityChange(quantity - 1)}
						className="p-2 text-gray-600 hover:text-primary disabled:opacity-50"
						disabled={quantity <= 1 || isUpdating}>
						<Minus size={16} />
					</button>
					<span className="px-3 text-center w-12 font-medium">
						{isUpdating ? (
							<Loader2 className="animate-spin mx-auto" size={16} />
						) : (
							quantity
						)}
					</span>
					<button
						onClick={() => handleQuantityChange(quantity + 1)}
						className="p-2 text-gray-600 hover:text-primary disabled:opacity-50"
						disabled={isUpdating}>
						<Plus size={16} />
					</button>
				</div>
				{/* Subtotal */}
				<div className="w-28 text-right">
					<p className="font-semibold text-gray-800">
						{formatCurrency(item.price * quantity)}
					</p>
				</div>
				{/* Remove Button */}
				<button
					onClick={() => onRemove(item.productVariantId)}
					className="text-gray-400 hover:text-red-500 transition-colors">
					<Trash2 size={20} />
				</button>
			</div>
		</div>
	);
};

// ===================================================================
// COMPONENT CON: Tóm tắt đơn hàng
// ===================================================================
const CartSummary = ({ subtotal }) => {
	const router = useRouter();
	const shippingCost = 0; // Tạm tính, bạn có thể thêm logic tính phí ship
	const total = subtotal + shippingCost;

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
						{formatCurrency(total)}
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
// COMPONENT CHÍNH: Trang Giỏ hàng
// ===================================================================
export default function CartPage() {
	// Giả định bạn có một hook `useCart` để quản lý state giỏ hàng
	const { cart, loading, error, updateItemQuantity, removeItem } = useCart();

	if (loading) return <CartLoadingSkeleton />;
	if (error)
		return (
			<div className="text-center text-red-500 p-8">
				Lỗi khi tải giỏ hàng: {error}
			</div>
		);
	if (!cart || cart.items.length === 0) return <EmptyCart />;

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-4xl font-bold text-gray-800 mb-6">
				Giỏ hàng của bạn
			</h1>
			<div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
				{/* Danh sách sản phẩm */}
				<div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
					<div className="divide-y divide-gray-200">
						{cart.items.map((item) => (
							<CartItemRow
								key={item.productVariantId}
								item={item}
								onUpdateQuantity={updateItemQuantity}
								onRemove={removeItem}
							/>
						))}
					</div>
				</div>

				{/* Tóm tắt đơn hàng */}
				<div className="lg:col-span-1 mt-8 lg:mt-0">
					<CartSummary subtotal={cart.subtotal} />
				</div>
			</div>
		</div>
	);
}
