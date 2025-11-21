// client/src/app/products/[productId]/page.tsx
import { getProductDetail } from "@shared/features/product/product.api";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
	params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
	const { productId } = await params;
	const res = await getProductDetail(productId);

	if (!res.success || !res.data) {
		notFound();
	}

	// res.data ở đây phải là kiểu ProductDetail (có pdName, images, description...)
	return <ProductDetailClient product={res.data} />;
}
