// "use client";

// import React from "react";
// import clsx from "clsx";

// interface SidebarTooltipProps {
//     label: string;
//     className?: string; // để có thể thêm class nếu cần
// }

// export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, className }) => {
//     return (
//         <div
//         className={clsx(
//             "absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2",
//             "bg-gradient-to-r from-gray-900/95 to-gray-800/90",
//             "text-white text-xs font-medium rounded-lg",
//             "opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
//             "shadow-lg backdrop-blur-sm transition-all duration-300",
//             "whitespace-nowrap z-50",
//             className
//         )}
//         >
//         {label}

//         {/* Mũi tên bên cạnh tooltip */}
//         <span
//             className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2
//             rotate-45
//             bg-gradient-to-tr from-white/90 to-gray-200/90
//             shadow-[2px_2px_6px_rgba(0,0,0,0.25)]
//             border border-white/30
//             rounded-sm"
//         />
//         {/* <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900/90 rotate-45"></span> */}
//         </div>
//     );
// };
// SidebarTooltip.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SidebarTooltipProps {
  label: string;
  parentRef: React.RefObject<HTMLElement>; // ref đến menu item
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, parentRef }) => {
  const [tooltipContainer, setTooltipContainer] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    setTooltipContainer(div);

    // Cleanup khi unmount
    return () => {
        document.body.removeChild(div);
    };
    }, []);


  useEffect(() => {
    if (parentRef?.current) {
      const rect = parentRef.current.getBoundingClientRect();
      setPosition({ top: rect.top + rect.height / 2, left: rect.right });
    }
  }, [parentRef]);

  if (!tooltipContainer) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left + 8,
        transform: "translateY(-50%)",
        zIndex: 9999,
      }}
      className="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300"
    >
      <div className="relative px-3 py-2 bg-gradient-to-r from-gray-900/95 to-gray-800/90 text-white text-xs font-medium rounded-lg shadow-lg backdrop-blur-sm">
        {label}
        {/* Mũi tên nhỏ */}
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2
            rotate-45
            bg-gradient-to-tr from-white/90 to-gray-200/90
            shadow-[2px_2px_6px_rgba(0,0,0,0.25)]
            border border-white/30
            rounded-sm"
        />
      </div>
    </div>,
    tooltipContainer
  );
};
