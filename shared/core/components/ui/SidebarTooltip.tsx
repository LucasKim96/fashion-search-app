// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import ReactDOM from "react-dom";
// import clsx from "clsx";

// interface SidebarTooltipProps {
//   label: string;
//   parentRef?: React.RefObject<HTMLElement>; // reference element để tính vị trí
// }

// /**
//  * Tooltip hiển thị khi sidebar bị thu gọn
//  * - Dùng Portal để luôn nổi trên layout
//  * - Vị trí hover dựa trên parentRef
//  */
// export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, parentRef }) => {
//   const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
//   const [visible, setVisible] = useState(false);
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   // Cập nhật vị trí tooltip dựa trên parent
//   useEffect(() => {
//     if (!parentRef?.current) return;

//     const parent = parentRef.current;

//     const handleMouseEnter = () => {
//       const rect = parent.getBoundingClientRect();
//       setCoords({
//         top: rect.top + rect.height / 2,
//         left: rect.right,
//       });
//       setVisible(true);
//     };
//     const handleMouseLeave = () => setVisible(false);

//     parent.addEventListener("mouseenter", handleMouseEnter);
//     parent.addEventListener("mouseleave", handleMouseLeave);

//     return () => {
//       parent.removeEventListener("mouseenter", handleMouseEnter);
//       parent.removeEventListener("mouseleave", handleMouseLeave);
//     };
//   }, [parentRef]);

//   if (!visible) return null;

//   return ReactDOM.createPortal(
//     <div
//       ref={tooltipRef}
//       style={{ top: coords.top, left: coords.left }}
//       className={clsx(
//         "fixed transform -translate-y-1/2 ml-3",
//         "px-3 py-2 bg-gradient-to-r from-gray-900/95 to-gray-800/90",
//         "text-white text-xs font-medium rounded-lg",
//         "shadow-lg backdrop-blur-sm transition-all duration-300",
//         "whitespace-nowrap z-[9999]"
//       )}
//     >
//       {label}

//       {/* Mũi tên */}
//       <span
//         className={clsx(
//           "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2",
//           "rotate-45 bg-gradient-to-tr from-white/90 to-gray-200/90",
//           "shadow-[2px_2px_6px_rgba(0,0,0,0.25)]",
//           "border border-white/30 rounded-sm"
//         )}
//       />
//     </div>,
//     document.body
//   );
// };


"use client";

import React from "react";
import clsx from "clsx";

interface SidebarTooltipProps {
    label: string;
}

/**
 * Tooltip hiển thị khi sidebar bị thu gọn
 */
export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label }) => {
    return (
        <div
        className={clsx(
            "absolute left-full top-1/2 -translate-y-1/2 ml-3",
            "px-3 py-2 bg-gradient-to-r from-gray-900/95 to-gray-800/90",
            "text-white text-xs font-medium rounded-lg",
            "opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
            "shadow-lg backdrop-blur-sm transition-all duration-300",
            "whitespace-nowrap z-[9999]"
        )}
        >
        {label}

        <span
            className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2",
            "rotate-45 bg-gradient-to-tr from-white/90 to-gray-200/90",
            "shadow-[2px_2px_6px_rgba(0,0,0,0.25)]",
            "border border-white/30 rounded-sm"
            )}
        />
        </div>
    );
};
