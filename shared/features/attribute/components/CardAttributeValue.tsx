"use client";

import React, { useState, useEffect } from "react";
import {
	AttributeValue,
	useAttributeValue,
	UpdateAttributeValueRequest,
	Attribute,
} from "../../../../shared/features/attribute/index";
import { Edit, EyeOff, Eye, Trash2, X, Check, Camera } from "lucide-react";
import {
	buildImageUrl,
	SidebarTooltip,
	ImagePreviewModal,
	Input,
	useNotification,
} from "@shared/core";
import clsx from "clsx";

interface CardAttributeValueProps {
	attribute: Attribute;
	value: AttributeValue;
	onEdit?: () => void;
	onHide?: () => void;
	onDelete?: () => void;
	showActions?: boolean;
	showStatus?: boolean;
	maxWidth?: string;
	compact?: boolean;
	mini?: boolean;
	selectable?: boolean; // bật chế độ chọn
	selected?: boolean; // trạng thái đã chọn
	singleSelect?: boolean; // bật chế độ chỉ chọn 1
	onSelectChange?: (selected: boolean) => void; // callback khi chọn/unselect
}

export const CardAttributeValue: React.FC<CardAttributeValueProps> = ({
	attribute,
	value,
	onEdit,
	onHide,
	onDelete,
	showActions = true,
	showStatus = true,
	maxWidth = "max-w-sm",
	compact = false,
	mini = false,
	selectable = false,
	selected = false,
	singleSelect = false,
	onSelectChange,
}) => {
	const {
		updateAdminAttributeValue,
		toggleAdminAttributeValue,
		deleteAdminAttributeValue,
	} = useAttributeValue();
	const { showConfirm } = useNotification();

	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const imageUrl = buildImageUrl(value.image);

	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState(value.value);
	const [editFile, setEditFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(
		(value.image ? buildImageUrl(value.image) : null) ?? null
	);

	useEffect(() => {
		return () => {
			if (previewUrl && editFile) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl, editFile]);

	const handleFileChange = (file: File | null) => {
		if (previewUrl && editFile) URL.revokeObjectURL(previewUrl);
		setEditFile(file);
		setPreviewUrl(
			file
				? URL.createObjectURL(file)
				: (value.image ? buildImageUrl(value.image) : null) ?? null
		);
	};

	const handleSaveEdit = async () => {
		let payload: UpdateAttributeValueRequest | FormData;

		if (editFile) {
			payload = new FormData();
			payload.append("value", editValue);
			payload.append("image", editFile);
		} else if (editValue !== value.value) {
			payload = { value: editValue };
		} else {
			setEditing(false);
			return;
		}

		const res = await updateAdminAttributeValue(value._id, payload);
		if (res.success) {
			setEditing(false);
			if (onEdit) onEdit(); // callback layout
		}
	};

	const handleCancelEdit = () => {
		setEditing(false);
		setEditValue(value.value);
		setEditFile(null);
		setPreviewUrl((value.image ? buildImageUrl(value.image) : null) ?? null);
	};

	const handleHide = () => {
		showConfirm({
			message: `Bạn có chắc chắn muốn ${
				value.isActive ? "ẩn" : "hiện"
			} giá trị này?`,
			onConfirm: async () => {
				const res = await toggleAdminAttributeValue(value._id);
				if (res.success && onHide) onHide();
			},
		});
	};

	const handleDelete = () => {
		showConfirm({
			message: "Bạn có chắc chắn muốn xóa giá trị thuộc tính này?",
			onConfirm: async () => {
				const res = await deleteAdminAttributeValue(value._id);
				if (res.success && onDelete) onDelete();
			},
		});
	};

	// ===== HANDLE SELECT =====
	const handleSelect = (e: React.MouseEvent) => {
		if (!selectable) return;

		// Không cho click vào các nút Edit/Hide/Delete/Preview kích hoạt select
		if ((e.target as HTMLElement).closest("button")) return;

		onSelectChange?.(!selected);
	};

	return (
		// <div className={`relative flex ${compact ? "flex-col p-2 max-w-[120px]" : mini ? "p-1 flex-row max-w-[150px]" : `flex-row p-4 ${maxWidth}`} items-center bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 gap-2 w-full group`}>
		<div
			onClick={handleSelect}
			className={clsx(
				"relative flex items-center rounded-xl border transition-shadow duration-300 gap-2 w-full",
				compact
					? "flex-col p-2 max-w-[120px]"
					: mini || selectable
					? "p-1 flex-row max-w-[150px]"
					: `flex-row p-4 ${maxWidth}`,
				"bg-white shadow-md hover:shadow-xl",
				selectable &&
					selected &&
					"bg-indigo-100 border border-indigo-400 shadow-xl scale-105"
			)}>
			{previewUrl || !mini ? (
				<div
					onClick={() => {
						if (selectable) return; // đang chọn → không mở preview
						if (!previewUrl) return;
						if (editing) return;
						setShowPreviewModal(true);
					}}
					// className={`relative ${compact ? "w-full aspect-square" : mini ? "flex-shrink-0 w-1/3 aspect-square" : "flex-shrink-0 w-2/5 aspect-square"} rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100 text-gray-400 cursor-pointer`}
					className={clsx(
						"relative rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100 text-gray-400 cursor-pointer",
						compact
							? "w-full aspect-square"
							: mini || selectable
							? "flex-shrink-0 w-1/3 aspect-square"
							: "flex-shrink-0 w-2/5 aspect-square"
						// Bỏ ring-2 và border khi selected
					)}>
					{previewUrl ? (
						<img
							src={previewUrl}
							alt={editValue}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-sm font-medium select-none">No Image</span>
					)}
				</div>
			) : null}

			{/* Nội dung */}
			<div
				className={`${
					compact
						? "w-full text-center mt-1"
						: "flex-1 flex flex-col justify-between gap-1"
				}`}>
				{/* Label + trạng thái */}
				<div
					className={clsx(
						"flex items-center gap-2 w-full",
						mini && "p-2 justify-start",
						compact && "flex-col items-center justify-center w-full gap-1",
						!mini && !compact && "justify-start"
					)}>
					{editing ? (
						<Input
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							className="flex-1 min-w-0 w-full"
						/>
					) : (
						<span
							className={clsx(
								"cursor-default flex-1 min-w-0",
								mini
									? "text-xs font-medium"
									: compact
									? "text-sm font-medium text-center"
									: "font-semibold text-gray-900 text-sm break-words"
							)}>
							{value.value}
						</span>
					)}

					{/* {!compact && !mini && showStatus && !editing && (
						<div className="relative flex-shrink-0 ml-auto">
							<span
								className={clsx(
									"block w-2 h-2 rounded-full transition-all duration-300",
									value.isActive
										? "bg-green-600 ring-1 ring-green-300 hover:ring-green-500"
										: "bg-red-600 ring-1 ring-red-300 hover:ring-red-500"
								)}
							/>
							<SidebarTooltip
								label={value.isActive ? "Hoạt động" : "Không hoạt động"}
								position="right"
							/>
						</div>
					)} */}
				</div>
				{/* Nút action */}
				{!compact && !mini && showActions && (
					<div className="grid grid-cols-3 gap-1 mt-2">
						{editing ? (
							<>
								<div className="relative col-start-1">
									<label
										className="flex-1 flex justify-center items-center p-1 
                                rounded-full bg-gradient-to-r from-blue-500 to-purple-600
                                text-white shadow-sm transition transform duration-200
                                hover:from-blue-600 hover:to-purple-700 hover:scale-105 active:scale-95 peer w-full cursor-pointer">
										<Camera size={16} />
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) =>
												handleFileChange(e.target.files?.[0] ?? null)
											}
										/>
									</label>
									<SidebarTooltip position="bottom" label="Tải ảnh" />
								</div>
								<div className="relative col-start-2">
									<button
										onClick={handleCancelEdit}
										className="flex-1 flex justify-center items-center p-1 
                                        rounded-full 
                                        bg-gradient-to-r from-gray-400 to-gray-500 
                                        text-white shadow-sm 
                                        transition transform duration-200 
                                        hover:from-gray-500 hover:to-gray-600 
                                        hover:scale-105 active:scale-95 peer w-full">
										<X size={16} />
									</button>
									<SidebarTooltip position="bottom" label="Hủy" />
								</div>

								<div className="relative ">
									<button
										onClick={handleSaveEdit}
										className="flex-1 flex justify-center items-center p-1
                                    rounded-full
                                    bg-gradient-to-r from-green-400 to-green-600
                                    text-white shadow-sm
                                    transition transform duration-200
                                    hover:from-green-500 hover:to-green-700
                                    hover:scale-105 active:scale-95 peer w-full">
										<Check size={16} />
									</button>
									<SidebarTooltip position="bottom" label="Lưu" />
								</div>

								{/* Nếu cần nút xóa khi editing, có thể thêm ở đây */}
							</>
						) : (
							<>
								{onEdit && (
									<div
										className={clsx(
											"relative",
											attribute.isActive ? "col-start-1" : "col-start-2"
										)}>
										<button
											onClick={() => setEditing(true)}
											className="flex-1 flex justify-center items-center p-1 
                                        rounded-full 
                                        bg-gradient-to-r from-blue-500 to-indigo-600 
                                        text-white shadow-sm 
                                        transition transform duration-200 
                                        hover:from-blue-600 hover:to-indigo-800 
                                        hover:scale-105 active:scale-95 peer w-full">
											<Edit size={16} />
										</button>
										<SidebarTooltip position="bottom" label="Chỉnh sửa" />
									</div>
								)}

								{/* Nút ẩn/hiện value chỉ hiện nếu attribute.active */}
								{onHide && attribute.isActive && (
									<div className="relative">
										<button
											onClick={handleHide}
											className={clsx(
												"flex-1 flex justify-center items-center p-1 rounded-full shadow-sm transition transform duration-200 hover:scale-105 active:scale-95 peer w-full",
												value.isActive
													? "bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-600 hover:to-gray-700"
													: "bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-600 hover:to-gray-700"
											)}>
											{value.isActive ? (
												<EyeOff size={16} />
											) : (
												<Eye size={16} />
											)}
										</button>
										<SidebarTooltip
											position="bottom"
											label={value.isActive ? "Ẩn giá trị" : "Hiện giá trị"}
										/>
									</div>
								)}

								{onDelete && (
									<div className="relative">
										<button
											onClick={handleDelete}
											className="flex-1 flex justify-center items-center p-1 
                                        rounded-full
                                        bg-gradient-to-r from-red-500 to-pink-600
                                        text-white shadow-sm 
                                        transition transform duration-200 
                                        hover:from-red-600 hover:to-pink-700 
                                        hover:scale-105 active:scale-95 peer w-full">
											<Trash2 size={16} />
										</button>
										<SidebarTooltip position="bottom" label="Xóa giá trị" />
									</div>
								)}
							</>
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
