import * as SearchService from "./search.service.js";

// 1. API DETECT
export const detectObjects = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "Vui lòng tải ảnh lên",
				data: null,
			});
		}

		const result = await SearchService.detectObjectsService(req.file);

		if (!result.success) {
			return res.status(400).json(result);
		}

		return res.status(200).json(result);
	} catch (error) {
		console.error("Detect Controller Error:", error);
		return res.status(500).json({
			success: false,
			message: "Lỗi hệ thống (Controller)",
			data: null,
			details: error.message,
		});
	}
};

// 2. API SEARCH
export const searchImage = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "Thiếu ảnh crop từ client",
				data: null,
			});
		}

		const result = await SearchService.searchImageService(req.file);

		if (!result.success) {
			return res.status(400).json(result);
		}

		return res.status(200).json(result);
	} catch (error) {
		console.error("Search Controller Error:", error);
		return res.status(500).json({
			success: false,
			message: "Lỗi hệ thống (Controller)",
			data: null,
			details: error.message,
		});
	}
};

// 3. API TEXT SEARCH
export const searchText = async (req, res) => {
	try {
		const { query, limit } = req.query;

		if (!query) {
			return res.status(400).json({
				success: false,
				message: "Vui lòng nhập từ khóa tìm kiếm",
				data: null,
			});
		}

		const result = await SearchService.searchByTextService(query, limit);

		return res.status(result.success ? 200 : 400).json(result);
	} catch (error) {
		console.error("Text Search Controller Error:", error);
		return res.status(500).json({
			success: false,
			message: "Lỗi hệ thống (Search Controller)",
			data: null,
			details: error.message,
		});
	}
};
