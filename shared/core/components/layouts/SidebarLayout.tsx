"use client";

import React, { useState } from "react";
import clsx from "clsx";

interface SidebarItem {
  id: string;
  label: string;
}

interface SidebarLayoutProps {
  items: SidebarItem[];
  renderContent: (selected: SidebarItem | null) => React.ReactNode;
  selectedId?: string;           // controlled selected
  onSelect?: (id: string) => void; // callback khi click
  width?: number;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  items,
  renderContent,
  selectedId: controlledSelectedId,
  onSelect,
  width = 200,
}) => {
  const isControlled = controlledSelectedId !== undefined;

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    items[0]?.id || null
  );

  // useEffect để reset internalSelectedId khi items thay đổi
  React.useEffect(() => {
    if (items.length === 0) {
      setInternalSelectedId(null);
    } else if (!items.find(item => item.id === internalSelectedId)) {
      setInternalSelectedId(items[0].id);
    }
  }, [items, internalSelectedId]);

  const selectedId = isControlled ? controlledSelectedId : internalSelectedId;

  const handleSelect = (id: string) => {
    if (onSelect) onSelect(id);
    if (!isControlled) setInternalSelectedId(id);
  };

  const selectedItem = items.find((item) => item.id === selectedId) || null;

  return (
    <div className="flex h-full w-full rounded-2xl shadow-xl overflow-hidden bg-gray-50 border border-gray-200">
      {/* Sidebar */}
      <div
        className="flex flex-col h-full overflow-y-auto overflow-x-hidden border-r border-gray-200
                  bg-gradient-to-b from-gray-100 via-gray-200 to-gray-50 shadow-inner"
        style={{ width }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={clsx(
              "px-6 py-3 w-full text-left flex items-center justify-between rounded-lg mb-2",
              "transition-all duration-300 transform hover:scale-[1.03] hover:shadow-md hover:bg-gray-300",
              selectedId === item.id
                ? "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 text-white font-semibold shadow-lg"
                : "text-gray-800 hover:bg-gray-300"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 p-8 h-full overflow-y-auto overflow-x-hidden bg-white
                  shadow-inner rounded-tr-2xl rounded-br-2xl"
      >
        {renderContent(selectedItem)}
      </div>
    </div>
  );
};

// "use client";

// import React, { useState } from "react";
// import clsx from "clsx";

// interface SidebarItem {
//   id: string;
//   label: string;
// }

// interface SidebarLayoutProps {
//   items: SidebarItem[];
//   renderContent: (selected: SidebarItem | null) => React.ReactNode;
//   selectedId?: string;           // controlled selected
//   onSelect?: (id: string) => void; // callback khi click
//   width?: number;
// }

// export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
//   items,
//   renderContent,
//   selectedId: controlledSelectedId,
//   onSelect,
//   width = 240,
// }) => {
//   const [selectedId, setSelectedId] = useState<string | null>(
//     controlledSelectedId || items[0]?.id || null
//   );

//   React.useEffect(() => {
//     if (controlledSelectedId !== undefined) setSelectedId(controlledSelectedId);
//   }, [controlledSelectedId]);

//   const selectedItem = items.find((item) => item.id === selectedId) || null;

//   return (
//     <div className="flex h-full w-full rounded-2xl shadow-xl overflow-hidden bg-gray-50 border border-gray-200">
//       {/* Sidebar */}
//       <div
//         className="flex flex-col h-full overflow-y-auto overflow-x-hidden border-r border-gray-200
//                   bg-gradient-to-b from-gray-100 via-gray-200 to-gray-50 shadow-inner"
//         style={{ width }}
//       >
//         {items.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => setSelectedId(item.id)}
//             className={clsx(
//               "px-6 py-3 w-full text-left flex items-center justify-between rounded-lg mb-2",
//               "transition-all duration-300 transform hover:scale-[1.03] hover:shadow-md hover:bg-gray-300",
//               selectedId === item.id
//                 ? "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 text-white font-semibold shadow-lg"
//                 : "text-gray-800 hover:bg-gray-300"
//             )}
//           >
//             {item.label}
//           </button>
//         ))}
//       </div>

//       {/* Content */}
//       <div
//         className="flex-1 p-8 h-full overflow-y-auto overflow-x-hidden bg-white
//                   shadow-inner rounded-tr-2xl rounded-br-2xl"
//       >
//         {renderContent(selectedItem)}
//       </div>
//     </div>
//   );
// };


// "use client";

// import React, { useState } from "react";
// import clsx from "clsx";

// interface SidebarItem {
//   id: string;
//   label: string;
// }

// interface SidebarLayoutProps {
//   items: SidebarItem[];
//   renderContent: (selected: SidebarItem | null) => React.ReactNode;
//   initialSelectedId?: string;
//   width?: number;
// }

// export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
//   items,
//   renderContent,
//   initialSelectedId,
//   width = 240,
// }) => {
//   const [selectedId, setSelectedId] = useState<string | null>(
//     initialSelectedId || items[0]?.id || null
//   );

//   const selectedItem = items.find((item) => item.id === selectedId) || null;

//   return (
//     <div className="flex h-full w-full rounded-2xl shadow-xl overflow-hidden bg-gray-50 border border-gray-200">
//       {/* Sidebar */}
//       <div
//         className="flex flex-col h-full overflow-y-auto overflow-x-hidden border-r border-gray-200
//                   bg-gradient-to-b from-gray-100 via-gray-200 to-gray-50 shadow-inner"
//         style={{ width }}
//       >
//         {items.map((item) => (
//           <button
//             key={item.id}
//             onClick={() => setSelectedId(item.id)}
//             className={clsx(
//               "px-6 py-3 w-full text-left flex items-center justify-between rounded-lg mb-2",
//               "transition-all duration-300 transform hover:scale-[1.03] hover:shadow-md hover:bg-gray-300",
//               selectedId === item.id
//                 ? "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 text-white font-semibold shadow-lg"
//                 : "text-gray-800 hover:bg-gray-300"
//             )}
//           >
//             {item.label}
//           </button>
//         ))}
//       </div>

//       {/* Content */}
//       <div
//         className="flex-1 p-8 h-full overflow-y-auto overflow-x-hidden bg-white
//                   shadow-inner rounded-tr-2xl rounded-br-2xl"
//       >
//         {renderContent(selectedItem)}
//       </div>
//     </div>
//   );
// };
