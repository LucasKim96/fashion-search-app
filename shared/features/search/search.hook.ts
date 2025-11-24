import { useState, useCallback } from "react";
import { detectObjects, searchByImage } from "./search.api"; // Dùng relative path
import {
	SearchCandidate,
	ProductSearchResult,
	BoundingBox,
} from "./search.types";
import { useNotification, errorUtils } from "@shared/core/";

export const useImageSearch = () => {
	// Context Notification
	const { showToast } = useNotification();

	// State 1: Ảnh gốc user upload
	const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
	const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);

	// State 2: Kết quả detect (Các box gợi ý)
	const [candidates, setCandidates] = useState<SearchCandidate[]>([]);

	// State 3: Box đang chọn để crop
	const [selectedBox, setSelectedBox] = useState<BoundingBox | null>(null);

	// State 4: Kết quả tìm kiếm
	const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);

	// State Loading
	const [isDetecting, setIsDetecting] = useState(false);
	const [isSearching, setIsSearching] = useState(false);

	/**
	 * BƯỚC 1: Xử lý khi user upload ảnh
	 */
	const handleUpload = useCallback(
		async (file: File) => {
			try {
				setIsDetecting(true);
				setSearchResults([]);
				setCandidates([]);
				setSelectedBox(null);

				// Tạo preview
				const url = URL.createObjectURL(file);
				setOriginalImageUrl(url);
				setOriginalImageFile(file);

				// Gọi API Detect
				const res = await detectObjects(file);

				if (res.success && res.data) {
					// SỬA: Type DetectResponseData đã có key candidates nên gọi res.data.candidates là an toàn
					const boxes = res.data.candidates || [];
					setCandidates(boxes);

					// Mặc định chọn box đầu tiên nếu có
					if (boxes.length > 0) {
						setSelectedBox(boxes[0].box);
					} else {
						showToast(
							"Không nhận diện được vật thể, vui lòng chọn vùng thủ công.",
							"info"
						);
					}
				}
			} catch (error: any) {
				// SỬA: Dùng errorUtils để parse lỗi chuẩn
				const errorMsg = errorUtils.parseApiError(error);
				showToast(`Lỗi phân tích ảnh: ${errorMsg}`, "error");

				// Reset ảnh nếu lỗi ngay bước đầu
				setOriginalImageUrl(null);
				setOriginalImageFile(null);
			} finally {
				setIsDetecting(false);
			}
		},
		[showToast]
	);

	/**
	 * BƯỚC 2: Tìm kiếm dựa trên ảnh đã Crop
	 */
	const handleSearch = useCallback(
		async (croppedBlob: Blob) => {
			try {
				setIsSearching(true);
				const res = await searchByImage(croppedBlob);

				if (res.success && res.data) {
					setSearchResults(res.data);
					if (res.data.length === 0) {
						showToast("Không tìm thấy sản phẩm tương tự.", "info");
					}
				} else {
					setSearchResults([]);
					showToast(res.message || "Không tìm thấy sản phẩm nào", "info");
				}
			} catch (error: any) {
				// SỬA: Dùng errorUtils
				const errorMsg = errorUtils.parseApiError(error);
				showToast(`Lỗi tìm kiếm: ${errorMsg}`, "error");
			} finally {
				setIsSearching(false);
			}
		},
		[showToast]
	);

	const resetSearch = useCallback(() => {
		// Revoke object URL để tránh leak memory
		if (originalImageUrl) {
			URL.revokeObjectURL(originalImageUrl);
		}
		setOriginalImageUrl(null);
		setOriginalImageFile(null);
		setCandidates([]);
		setSelectedBox(null);
		setSearchResults([]);
	}, [originalImageUrl]);

	return {
		// Data
		originalImageUrl,
		originalImageFile,
		candidates,
		selectedBox,
		searchResults,

		// Status
		isDetecting,
		isSearching,

		// Actions
		handleUpload,
		handleSearch,
		setSelectedBox,
		resetSearch,
	};
};
