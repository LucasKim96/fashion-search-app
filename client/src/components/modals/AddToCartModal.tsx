"use client";

import React, { useState } from "react";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { ProductDetail } from "@shared/features/product/product.types";
import { formatCurrency, buildImageUrl } from "@shared/core";

interface AddToCartModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: ProductDetail;
	selectedVariant: any | null; // Biến thể đã chọn
	onConfirm: (quantity: number) => void;
}

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
	isOpen,
	onClose,
	product,
	selectedVariant,
	onConfirm,
}) => {
	const [quantity, setQuantity] = useState(1);
	const [isAdding, setIsAdding] = useState(false);

	if (!isOpen) return null;

	// Tính toán thông tin hiển thị
	const displayImage = selectedVariant?.image
		? buildImageUrl(selectedVariant.image)
		: buildImageUrl(product.images?.[0]);

	const displayPrice = selectedVariant?.priceAdjustment
		? product.basePrice + selectedVariant.priceAdjustment
		: product.basePrice;

	const currentStock = selectedVariant
		? selectedVariant.stock
		: product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

	// Xử lý tăng giảm số lượng
	const handleIncrease = () => {
		if (quantity < currentStock) setQuantity((prev) => prev + 1);
	};

	const handleDecrease = () => {
		if (quantity > 1) setQuantity((prev) => prev - 1);
	};

	const handleConfirm = async () => {
		setIsAdding(true);
		await onConfirm(quantity);
		setIsAdding(false);
		onClose();
	};

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
			{/* Overlay click to close */}
			<div className="absolute inset-0" onClick={onClose} />

			<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
					<X size={20} />
				</button>

				<h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
					<ShoppingCart className="text-primary" />
					Thêm vào giỏ hàng
				</h3>

				{/* Product Info Summary */}
				<div className="flex gap-4 mb-6">
					<div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
						<img
							src={displayImage}
							alt={product.pdName}
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="flex-1">
						<h4 className="font-semibold text-gray-900 line-clamp-2">
							{product.pdName}
						</h4>
						<p className="text-red-600 font-bold mt-1">
							{formatCurrency(displayPrice)}
						</p>
						{selectedVariant && (
							<div className="flex flex-wrap gap-1 mt-2">
								{selectedVariant.attributes.map((attr: any, idx: number) => (
									<span
										key={idx}
										className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
										{attr.valueLabel}
									</span>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Quantity Selector */}
				<div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-xl">
					<span className="font-medium text-gray-700">Số lượng</span>
					<div className="flex items-center gap-4">
						<div className="flex items-center border border-gray-300 rounded-lg bg-white">
							<button
								onClick={handleDecrease}
								disabled={quantity <= 1}
								className="p-2 hover:bg-gray-100 disabled:opacity-50 text-gray-600 rounded-l-lg transition-colors">
								<Minus size={16} />
							</button>
							<span className="w-10 text-center font-bold text-gray-800">
								{quantity}
							</span>
							<button
								onClick={handleIncrease}
								disabled={quantity >= currentStock}
								className="p-2 hover:bg-gray-100 disabled:opacity-50 text-gray-600 rounded-r-lg transition-colors">
								<Plus size={16} />
							</button>
						</div>
						<span className="text-xs text-gray-500">
							Có sẵn: {currentStock}
						</span>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
						Hủy bỏ
					</button>
					<button
						onClick={handleConfirm}
						disabled={isAdding}
						className="flex-1 py-3 rounded-xl bg-primary text-black font-bold hover:bg-primary-light shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
						{isAdding ? "Đang thêm..." : "Xác nhận"}
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};
