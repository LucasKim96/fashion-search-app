import * as SettingService from "../setting/setting.service.js";
import { apiResponse, ApiError } from "../../utils/index.js";

const { successResponse, errorResponse } = apiResponse;

export const getSettingController = async (req, res, next) => {
  try {
    const data = await SettingService.getSettings();
    return successResponse(res, data, "Lấy settings thành công");
  } catch (err) {
    next(err);
  }
};

export const updateSettingController = async (req, res, next) => {
  try {
    const { logoDefaultUrl, coverDefaultUrl } = req.body;
    const data = await SettingService.updateSettings({
      logoDefaultUrl,
      coverDefaultUrl,
    });

    return successResponse(res, data, "Cập nhật cài đặt mặc định thành công");
  } catch (err) {
    next(err);
  }
};

export const updateDefaultLogo = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Upload logo mới đi bro 😎");

    const result = await SettingService.updateDefaultImage("logo", req.file);

    return successResponse(
      res,
      { logoDefaultUrl: result.newUrl },
      `Cập nhật logo mặc định thành công. ${result.shopsUpdated} shop đã được cập nhật.`
    );
  } catch (err) {
    next(err);
  }
};
