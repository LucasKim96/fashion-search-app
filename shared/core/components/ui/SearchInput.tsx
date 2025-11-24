"use client";

import React from "react";
import { Search, Camera } from "lucide-react";
import clsx from "clsx";

interface SearchInputProps {
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	onEnterPress?: () => void;
	onCameraClick?: () => void; // Prop nhận sự kiện click camera
	className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
	placeholder = "Tìm kiếm...",
	value,
	onChange,
	onEnterPress,
	onCameraClick,
	className,
}) => {
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && onEnterPress) {
			onEnterPress();
		}
	};

	return (
		<div className={clsx("relative w-full", className)}>
			{/* Icon Search bên TRÁI */}
			<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
				<Search className="text-gray-400" size={20} />
			</div>

			{/* Input Field */}
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				className={clsx(
					"w-full py-2.5 rounded-full border border-gray-200",
					"bg-gray-50 text-gray-800 text-sm font-medium shadow-sm",
					"placeholder-gray-400",
					"focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200",
					"transition-all duration-300",
					"pl-12", // Padding trái cho icon Search
					onCameraClick ? "pr-12" : "pr-4" // Padding phải: nếu có Camera thì rộng ra (pr-12), không thì bình thường (pr-4)
				)}
			/>

			{/* Icon Camera bên PHẢI */}
			{onCameraClick && (
				<button
					onClick={onCameraClick}
					type="button"
					className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer group z-10"
					title="Tìm kiếm bằng hình ảnh">
					<div className="p-1.5 rounded-full group-hover:bg-gray-200 transition-colors">
						<Camera
							className="text-gray-500 group-hover:text-blue-600 transition-colors"
							size={20}
						/>
					</div>
				</button>
			)}
		</div>
	);
};
