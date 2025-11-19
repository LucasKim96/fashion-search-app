"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";

interface SidebarTooltipProps {
    label: string;
    position?: "top" | "bottom" | "left" | "right";
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({
    label,
    position = "right",
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tooltip = ref.current;
        if (!tooltip) return;

        const parent = tooltip.parentElement;
        if (!parent) return;

        // Lấy width của nút để căn giữa
        const parentWidth = parent.getBoundingClientRect().width;
        tooltip.style.setProperty("--parent-width", `${parentWidth}px`);
    }, []);

    const positionClasses: Record<string, string> = {
        right: "left-full top-1/2 -translate-y-1/2 ml-3",
        left: "right-full top-1/2 -translate-y-1/2 mr-3",
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    };

    const arrowClasses: Record<string, string> = {
        right: "left-0 top-1/2 -translate-y-1/2 -translate-x-1",
        left: "right-0 top-1/2 -translate-y-1/2 translate-x-1",
        top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1",
        bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1",
    };


    return (
        <div
            ref={ref}
            className={clsx(
                "absolute z-[9999]",
                positionClasses[position],
                "px-3 py-2 bg-gradient-to-r from-gray-900/95 to-gray-800/90",
                "text-white text-xs font-medium rounded-lg",
                "opacity-0 peer-hover:opacity-100 pointer-events-none",
                "shadow-lg backdrop-blur-sm transition-all duration-300",
                "whitespace-nowrap"
            )}
        >
            {label}

            <span
                className={clsx(
                    "absolute w-2 h-2 rotate-45",
                    "bg-gradient-to-tr  from-gray-900/95 to-gray-800/90",
                    "shadow-[2px_2px_6px_rgba(0,0,0,0.25)]",
                    "border border-white/30 rounded-sm",
                    arrowClasses[position]
                )}
            />
        </div>
    );
};


