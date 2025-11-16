"use client";

import React, { useState } from "react";
import { AttributeValue } from "../attributeValue.types";
import { Edit, EyeOff, Trash2, X  } from "lucide-react";
// import { buildImageUrl } from "@shared/core/utils/image.utils";
import { buildImageUrl, SidebarTooltip, ImagePreviewModal } from "@shared/core";
import { AnimatePresence, motion } from "framer-motion";

interface CardAttributeValueProps {
    value: AttributeValue;
    onEdit?: () => void;
    onHide?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
    showStatus?: boolean;
    maxWidth?: string;
    compact?: boolean;
    mini?: boolean;
}

export const CardAttributeValue: React.FC<CardAttributeValueProps> = ({
    value,
    onEdit,
    onHide,
    onDelete,
    showActions = true,
    showStatus = true,
    maxWidth = "max-w-sm",
    compact = false,
    mini = false,
}) => {
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const imageUrl = buildImageUrl(value.image);

    return (
        <div className={`flex ${compact ? "flex-col p-2 max-w-[120px]" : mini ? "p-1 flex-row max-w-[150px]" : `flex-row p-4 ${maxWidth}`} items-center bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 gap-2 w-full group`}>

        {/* Ảnh */}
        {imageUrl && (
            <div 
            onClick={() => setShowPreviewModal(true)}
            className={`cursor-pointer ${
                compact ? "w-full aspect-square" 
                : mini ? "flex-shrink-0 w-1/3 aspect-square" 
                : "flex-shrink-0 w-2/5 aspect-square"
            } rounded-lg overflow-hidden border border-gray-200`}
            >
            <img src={imageUrl} alt={value.value} className="w-full h-full object-cover" />
            </div>
        )}

        {/* Nội dung */}
        <div className={`${compact ? "w-full text-center mt-1" : "flex-1 flex flex-col justify-between gap-1"}`}>
        {/* Label + trạng thái */}
        <div
        className={
            mini
            ? "p-2 flex items-center justify-start gap-1"
            : compact
            ? "flex flex-col items-center justify-center gap-1 w-full"
            : "flex items-center justify-start gap-2"
        }
        >
        <span
            className={`${
            mini
                ? "text-xs font-medium"
                : compact
                ? "text-sm font-medium text-center"
                : "font-semibold text-gray-900 text-sm break-words"
            } cursor-default`}
        >
            {value.value}
        </span>

        {!compact && !mini && showStatus && (
            <div className="relative flex-shrink-0 ml-2">
            {/* Dot trạng thái */}
            <span
                className={`block w-2 h-2 rounded-full transition-all duration-300
                ${value.isActive
                    ? "bg-green-500 ring-1 ring-green-300 hover:ring-green-500"
                    : "bg-red-500 ring-1 ring-red-300 hover:ring-red-500"
                }
                `}
            />
            {/* Tooltip */}
            <SidebarTooltip
                label={value.isActive ? "Hoạt động" : "Không hoạt động"}
                position="right"
            />
            </div>
        )}
        </div>


            {/* Nút action chỉ hiển thị chế độ bình thường */}
            {!compact && !mini && showActions && (
            <div className="grid grid-cols-3 gap-1 mt-2">
                {onEdit && (
                <div className="relative">
                    <button
                    onClick={onEdit}
                    className="flex-1 flex justify-center items-center p-1 
                                rounded-md 
                                bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 
                                text-blue-800 shadow-sm 
                                transition transform duration-200 
                                hover:from-blue-100 hover:via-blue-200 hover:to-blue-100
                                hover:scale-105 active:scale-95 peer w-full"
                    >
                    <Edit size={16} />
                    </button>
                    <SidebarTooltip position="left" label="Chỉnh sửa" />
                </div>
                )}

                {onHide && (
                <div className="relative">
                    <button
                    onClick={onHide}
                    className="flex-1 flex justify-center items-center p-1 
                                rounded-md 
                                bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 
                                text-gray-800 shadow-sm 
                                transition transform duration-200 
                                hover:from-gray-100 hover:via-gray-300 hover:to-gray-100
                                hover:scale-105 active:scale-95 peer w-full"
                    >
                    <EyeOff size={16} />
                    </button>
                    <SidebarTooltip position="left" label="Ẩn giá trị" />
                </div>
                )}

                {onDelete && (
                <div className="relative">
                    <button
                    onClick={onDelete}
                    className="flex-1 flex justify-center items-center p-1 
                                rounded-md 
                                bg-gradient-to-r from-red-300 via-red-400 to-red-300 
                                text-red-800 shadow-sm 
                                transition transform duration-200 
                                hover:from-red-100 hover:via-red-300 hover:to-red-100 
                                hover:scale-105 active:scale-95 peer w-full"
                    >
                    <Trash2 size={16} />
                    </button>
                    <SidebarTooltip position="left" label="Xóa giá trị" />
                </div>
                )}
            </div>
            )}
        </div>

        {/* Modal hiển thị ảnh */}
        <ImagePreviewModal
            imageUrl={imageUrl}
            alt={value.value}
            open={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
        />
        </div>
    );
};
