"use client";

import React from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

interface SearchInputProps {
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	onEnterPress?: () => void; // Thêm callback khi nhấn Enter
	className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
	placeholder = "Tìm kiếm...",
	value,
	onChange,
	onEnterPress,
	className,
}) => {
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && onEnterPress) {
			onEnterPress();
		}
	};

	return (
		<div className={clsx("relative w-full", className)}>
			{/* Div wrapper để căn giữa icon bằng Flexbox */}
			<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
				<Search className="text-gray-400" size={20} />
			</div>
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				className="w-full pl-12 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-gray-50 text-gray-800 transition-all duration-300 placeholder-gray-400 text-sm font-medium shadow-sm"
			/>
		</div>
	);
};
