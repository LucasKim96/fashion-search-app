import { createUploader } from "../utils/index.js";

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
