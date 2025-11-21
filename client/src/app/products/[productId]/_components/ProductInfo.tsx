"use client";

import { useState, useMemo } from "react";
import { ProductDetail, ProductVariantDetail } from "@shared/features/product";
import { formatCurrency, buildImageUrl } from "@shared/core";
import { ShieldCheck, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

// Helper để nhóm các thuộc tính
const groupAttributes = (variants: ProductVariantDetail[]) => {
	const groups: Record<
		string,
		{ attributeId: string; values: { valueId: string; valueLabel: string }[] }
	> = {};
	variants.forEach((variant) => {
		variant.attributes.forEach((attr) => {
			if (attr.attributeId && attr.valueId) {
				if (!groups[attr.attributeLabel!]) {
					groups[attr.attributeLabel!] = {
						attributeId: attr.attributeId,
						values: [],
					};
				}
				// Tránh thêm trùng lặp value
				if (
					!groups[attr.attributeLabel!].values.some(
						(v) => v.valueId === attr.valueId
					)
				) {
					groups[attr.attributeLabel!].values.push({
						valueId: attr.valueId,
						valueLabel: attr.valueLabel!,
					});
				}
			}
		});
	});
	return Object.entries(groups).map(([label, data]) => ({ label, ...data }));
};

export const ProductInfo = ({ product }: { product: ProductDetail }) => {
	// State để lưu các tùy chọn người dùng đã chọn
	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({});
	const router = useRouter();

	const attributeGroups = useMemo(
		() => groupAttributes(product.variants || []),
		[product.variants]
	);

	// Tìm variant khớp với các tùy chọn đã chọn
	const selectedVariant = useMemo(() => {
		if (Object.keys(selectedOptions).length !== attributeGroups.length)
			return null;
		return product.variants?.find((variant) =>
			variant.attributes.every(
				(attr) => selectedOptions[attr.attributeLabel!] === attr.valueId
			)
		);
	}, [selectedOptions, product.variants, attributeGroups]);

	const handleOptionSelect = (attributeLabel: string, valueId: string) => {
		setSelectedOptions((prev) => ({
			...prev,
			[attributeLabel]: valueId,
		}));
	};

	const finalPrice = selectedVariant
		? product.basePrice + selectedVariant.priceAdjustment
		: product.basePrice;

	const shop = typeof product.shopId === "object" ? product.shopId : null;

	return (
		<div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
			{/* Shop Info */}
			{shop && (
				<div
					onClick={() => router.push(`/shops/${shop._id}`)}
					className="flex items-center gap-3 mb-4 cursor-pointer group">
					<img
						src={buildImageUrl(shop.logoUrl)}
						alt={shop.shopName}
						className="w-10 h-10 rounded-full border"
					/>
					<div>
						<h2 className="font-semibold text-gray-800 group-hover:text-primary transition">
							{shop.shopName}
						</h2>
						<p className="text-xs text-gray-500">
							{shop.lastActiveText ||
								(shop.isOnline ? "Đang hoạt động" : "Ngoại tuyến")}
						</p>
					</div>
				</div>
			)}

			<h1 className="text-3xl font-bold tracking-tight text-gray-900">
				{product.pdName}
			</h1>

			<div className="mt-3">
				<p className="text-3xl tracking-tight text-primary">
					{formatCurrency(finalPrice)}
				</p>
				{selectedVariant && selectedVariant.priceAdjustment !== 0 && (
					<p className="text-sm text-gray-500 line-through">
						{formatCurrency(product.basePrice)}
					</p>
				)}
			</div>

			{/* Variant Selectors */}
			<div className="mt-10">
				<div className="space-y-6">
					{attributeGroups.map((group) => (
						<div key={group.attributeId}>
							<h3 className="text-sm font-medium text-gray-900">
								{group.label}
							</h3>
							<div className="flex flex-wrap gap-2 mt-2">
								{group.values.map((value) => (
									<button
										key={value.valueId}
										onClick={() =>
											handleOptionSelect(group.label, value.valueId)
										}
										className={clsx(
											"px-4 py-2 border rounded-full text-sm font-medium transition",
											selectedOptions[group.label] === value.valueId
												? "bg-primary text-white border-primary"
												: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
										)}>
										{value.valueLabel}
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="mt-10 flex flex-col gap-4">
				<button
					disabled={attributeGroups.length > 0 && !selectedVariant}
					className="flex w-full items-center justify-center rounded-md border border-transparent bg-gray-800 px-8 py-3 text-base font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
					<Store className="mr-2" />
					Liên hệ cửa hàng
				</button>
				<div className="flex items-center justify-center gap-2 text-sm text-gray-500">
					<ShieldCheck size={16} />
					<span>Sản phẩm được đảm bảo bởi FashionSearch</span>
				</div>
			</div>
		</div>
	);
};
