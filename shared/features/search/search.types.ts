// shared/features/search/search.types.ts
import { Product } from "../product/product.types"; // Import kiểu Product đã có

// --- DETECT TYPES ---

// Box Coordinates: [x1, y1, x2, y2]
export type BoundingBox = [number, number, number, number];

export interface SearchCandidate {
	label: "upper_body" | "lower_body" | "full_body";
	box: BoundingBox;
	type: "detected" | "merged";
}

// Response của API detect (data trong ApiResponse)
export interface DetectResponseData {
	candidates: SearchCandidate[];
}

// --- SEARCH TYPES ---

// Sản phẩm trả về từ Search Image sẽ có thêm trường similarity
export interface ProductSearchResult extends Product {
	similarity: number;
	matchedImage: string; // Tên ảnh đại diện khớp nhất
}

// Response của API search (data trong ApiResponse)
export type SearchImageResponseData = ProductSearchResult[];
