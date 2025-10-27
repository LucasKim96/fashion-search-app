import Setting from "./setting.model.js";
import fs from "fs";
import path from "path";
import { updateDefaultImageForShops } from "../shop/shop.service.js";
import { ApiError } from "../../utils/index.js";

export const getSettings = async () => {
  const setting = await Setting.findOne();
  if (!setting) {
    throw ApiError.notFound("Chưa có cài đặt hệ thống");
  }
  return setting;
};

export const updateSettings = async (data) => {
  const setting = await Setting.findOne();
  if (!setting) {
    throw ApiError.notFound("Chưa có cài đặt hệ thống");
  }

  if (data.logoDefaultUrl) setting.logoDefaultUrl = data.logoDefaultUrl;
  if (data.coverDefaultUrl) setting.coverDefaultUrl = data.coverDefaultUrl;

  await setting.save();

  return setting;
};

export const updateDefaultImage = async (type, file) => {
  const updateField = type === "logo" ? "logoDefaultUrl" : "coverDefaultUrl";
  const newUrl = `/assets/shop-defaults/${file.filename}`;

  const currentSetting = await Setting.findOne({});
  const oldUrl = currentSetting?.[updateField];

  // Nếu có ảnh cũ thì delete nó trước
  if (oldUrl) {
    const oldFilePath = path.join(
      process.cwd(),
      "src",
      oldUrl.replace(/^\//, "") // bỏ dấu /
    );

    fs.unlink(oldFilePath, (err) => {
      if (err) {
        console.warn("Không thể xóa logo cũ:", err.message);
      } else {
        console.log("Ảnh cũ đã bay màu:", oldFilePath);
      }
    });
  }

  currentSetting[updateField] = newUrl;
  await currentSetting.save();

  // update shops if needed
  const shopsUpdated = 0;

  return {
    newUrl,
    shopsUpdated,
  };
};
