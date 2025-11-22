"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface SelectProps {
	label?: React.ReactNode;
	value: string;
	onValueChange: (value: string) => void;
	children: React.ReactNode;
	placeholder?: string;
	className?: string;
}

interface SelectItemProps {
	value: string;
	children: React.ReactNode;
}

export const Select = ({
	label,
	value,
	onValueChange,
	children,
	placeholder,
	className,
}: SelectProps) => {
	const [open, setOpen] = React.useState(false);
	const buttonRef = React.useRef<HTMLButtonElement>(null);
	const [coords, setCoords] = React.useState({
		top: 0,
		left: 0,
		width: 0,
		openUpwards: false,
	});

	// Close dropdown when clicked outside
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node) &&
				!(event.target as Element).closest(".select-dropdown-portal")
			) {
				setOpen(false);
			}
		};

		const handleScroll = () => {
			if (open) setOpen(false);
		};

		document.addEventListener("mousedown", handleClickOutside);
		window.addEventListener("scroll", handleScroll, true);
		window.addEventListener("resize", handleScroll);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", handleScroll, true);
			window.removeEventListener("resize", handleScroll);
		};
	}, [open]);

	const handleToggle = () => {
		if (!open && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const dropdownHeight = 250;
			const openUpwards = spaceBelow < dropdownHeight;

			setCoords({
				// Với position: fixed, ta dùng rect.top trực tiếp (không cộng window.scrollY)
				top: rect.top,
				left: rect.left,
				width: rect.width,
				openUpwards,
			});
		}
		setOpen((prev) => !prev);
	};

	const items = React.Children.toArray(children).filter((child: any) =>
		React.isValidElement(child)
	) as React.ReactElement<SelectItemProps>[];

	const selectedItem = items.find((item) => item.props.value === value);

	return (
		<div className={clsx("relative w-full", className)}>
			{label && (
				<label className="text-gray-500 font-medium mb-1 block">{label}</label>
			)}
			<button
				ref={buttonRef}
				type="button"
				onClick={handleToggle}
				className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all">
				<span className="truncate">
					{selectedItem?.props.children || placeholder || "Chọn..."}
				</span>
				<ChevronDown
					className={clsx("w-4 h-4 transition-transform", open && "rotate-180")}
				/>
			</button>

			{open &&
				createPortal(
					<div
						className="select-dropdown-portal fixed z-[99999] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
						style={{
							left: coords.left,
							width: coords.width,
							// --- SỬA LỖI TẠI ĐÂY ---
							// Nếu mở lên trên: top = auto, bottom = khoảng cách từ đáy màn hình đến đỉnh nút + margin
							// Nếu mở xuống dưới: top = đỉnh nút + chiều cao nút + margin, bottom = auto
							top: coords.openUpwards
								? "auto"
								: coords.top + (buttonRef.current?.offsetHeight || 0) + 4,
							bottom: coords.openUpwards
								? window.innerHeight - coords.top + 4
								: "auto",
						}}>
						<div className="max-h-60 overflow-auto custom-scrollbar">
							{items.map((item) => {
								const isSelected = item.props.value === value;
								return (
									<div
										key={item.props.value}
										onClick={() => {
											onValueChange(item.props.value);
											setOpen(false);
										}}
										className={clsx(
											"px-4 py-2 cursor-pointer select-none transition-colors duration-200 text-sm",
											"hover:bg-blue-50 hover:text-blue-700",
											isSelected
												? "bg-blue-100 text-blue-800 font-semibold"
												: "text-gray-700"
										)}>
										{item.props.children}
									</div>
								);
							})}
							{items.length === 0 && (
								<div className="px-4 py-3 text-sm text-gray-400 text-center">
									Trống
								</div>
							)}
						</div>
					</div>,
					document.body
				)}
		</div>
	);
};

export const SelectItem: React.FC<SelectItemProps> = ({ children }) => {
	return <>{children}</>;
};
// "use client";

// import * as React from "react";
// import { createPortal } from "react-dom";
// import { ChevronDown } from "lucide-react";
// import clsx from "clsx";

// interface SelectProps {
// 	label?: React.ReactNode; // <-- cho phép ReactNode
// 	value: string;
// 	onValueChange: (value: string) => void;
// 	children: React.ReactNode;
// 	placeholder?: string;
// 	className?: string;
// }

// interface SelectItemProps {
// 	value: string;
// 	children: React.ReactNode;
// }

// export const Select = ({
// 	label,
// 	value,
// 	onValueChange,
// 	children,
// 	placeholder,
// 	className,
// }: SelectProps) => {
// 	const [open, setOpen] = React.useState(false);
// 	const ref = React.useRef<HTMLDivElement>(null);

// 	// Close dropdown when clicked outside
// 	React.useEffect(() => {
// 		const handleClickOutside = (event: MouseEvent) => {
// 			if (ref.current && !ref.current.contains(event.target as Node))
// 				setOpen(false);
// 		};
// 		document.addEventListener("mousedown", handleClickOutside);
// 		return () => document.removeEventListener("mousedown", handleClickOutside);
// 	}, []);

// 	const items = React.Children.toArray(children).filter((child: any) =>
// 		React.isValidElement(child)
// 	) as React.ReactElement<SelectItemProps>[];

// 	const selectedItem = items.find((item) => item.props.value === value);

// 	return (
// 		<div className={clsx("relative w-full", className)} ref={ref}>
// 			{label && (
// 				<label className="text-gray-500 font-medium mb-1 block">
// 					{label} {/* <-- bây giờ có thể là ReactNode */}
// 				</label>
// 			)}
// 			<button
// 				type="button"
// 				onClick={() => setOpen((prev) => !prev)}
// 				className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all">
// 				<span>{selectedItem?.props.children || placeholder || "Chọn..."}</span>
// 				<ChevronDown
// 					className={clsx("w-4 h-4 transition-transform", open && "rotate-180")}
// 				/>
// 			</button>

// 			{open && (
// 				<div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-auto">
// 					{items.map((item) => {
// 						const isSelected = item.props.value === value;
// 						return (
// 							<div
// 								key={item.props.value}
// 								onClick={() => {
// 									onValueChange(item.props.value);
// 									setOpen(false);
// 								}}
// 								className={clsx(
// 									"px-4 py-2 cursor-pointer select-none rounded-lg mx-1 my-0.5 transition-colors duration-200",
// 									"hover:bg-blue-100 hover:text-blue-700",
// 									isSelected && "bg-blue-200 text-blue-800 font-semibold"
// 								)}>
// 								{item.props.children}
// 							</div>
// 						);
// 					})}
// 				</div>
// 			)}
// 		</div>
// 	);
// };

// export const SelectItem: React.FC<SelectItemProps> = ({ children }) => {
// 	return <>{children}</>;
// };
