import { createUploader } from "../utils/index.js";

//Upload search image
export const uploadDisk = createUploader({
	destinationGenerator: (req) => {
		// Lưu vào thư mục 'uploads/temp'
		// Ảnh search chỉ cần tồn tại trong vài giây để xử lý,
		// sau đó controller sẽ xóa đi. Để trong temp giúp dễ phân biệt với ảnh sản phẩm thật.
		return "temp";
	},
	useAssets: false, // Lưu vào uploads/temp

	// (Tùy chọn) Có thể tăng giới hạn lên 10MB nếu muốn hỗ trợ ảnh search chất lượng cao
	// customLimits: { fileSize: 10 * 1024 * 1024 }
});

// Upload avatar user
export const uploadUserAvatar = createUploader({
	destinationGenerator: (req) => {
		// Trả về đường dẫn TƯƠNG ĐỐI từ thư mục GỐC (uploads/)
		return "avatars";
	},
	useAssets: false, // Mặc định là false (lưu vào uploads)
});

export const uploadDefautlAvatar = createUploader({
	destinationGenerator: (req) => {
		// Trả về đường dẫn TƯƠNG ĐỐI từ thư mục GỐC (uploads/)
		return "avatars";
	},
	useAssets: true, // Mặc định là false (lưu vào uploads)
});

export const uploadAttribute = createUploader({
	destinationGenerator: (req) => {
		return "attributes";
	},
	useAssets: false, // Mặc định là false (lưu vào uploads)
});

export const uploadAttributeValueImages = createUploader({
	destinationGenerator: () => "attributes",
	useAssets: false,
}).any(); // nhận tất cả file, tương ứng với các fileKey khác nhau

// Upload ảnh sản phẩm chính (nhiều ảnh)
export const uploadProductImages = createUploader({
	destinationGenerator: () => "products",
	useAssets: false,
}).array("images", 50); // Tối đa 50 ảnh sản phẩm

// Upload tất cả file ảnh (bao gồm cả variant images)
export const uploadProduct = createUploader({
	destinationGenerator: () => "products",
	useAssets: false,
}).any(); // để xử lý cả images và fileKey của variants

//upload variant
export const uploadVariant = createUploader({
	destinationGenerator: (req) => {
		return "products";
	},
	useAssets: false, // Mặc định là false (lưu vào uploads)
});

// Upload image shop
export const uploadShopImage = createUploader({
	destinationGenerator: () => {
		return "shops";
	},
	useAssets: false,
});

export const uploadShopDefaultImage = createUploader({
	destinationGenerator: () => {
		return "shop";
	},
	useAssets: true, // Vẫn giữ nguyên là TRUE để lưu vào src/assets
});
