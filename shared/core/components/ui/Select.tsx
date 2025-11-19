"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface SelectProps {
    label?: React.ReactNode; // <-- cho phép ReactNode
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

export const Select = ({ label, value, onValueChange, children, placeholder, className }: SelectProps) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicked outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const items = React.Children.toArray(children).filter(
        (child: any) => React.isValidElement(child)
    ) as React.ReactElement<SelectItemProps>[];

    const selectedItem = items.find((item) => item.props.value === value);

    return (
        <div className={clsx("relative w-full", className)} ref={ref}>
            {label && (
                <label className="text-gray-500 font-medium mb-1 block">
                    {label} {/* <-- bây giờ có thể là ReactNode */}
                </label>
            )}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all"
            >
                <span>{selectedItem?.props.children || placeholder || "Chọn..."}</span>
                <ChevronDown className={clsx("w-4 h-4 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-auto">
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
                                    "px-4 py-2 cursor-pointer select-none rounded-lg mx-1 my-0.5 transition-colors duration-200",
                                    "hover:bg-blue-100 hover:text-blue-700",
                                    isSelected && "bg-blue-200 text-blue-800 font-semibold"
                                )}
                            >
                                {item.props.children}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const SelectItem: React.FC<SelectItemProps> = ({ children }) => {
    return <>{children}</>;
};
