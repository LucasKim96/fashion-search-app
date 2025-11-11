"use client";

import React from "react";
import { useAdminNavbar } from "@/features/auth/useAdminNavbar.hook";

export const AdminNavbar: React.FC = () => {
  const { userInfo, handleAccountClick } = useAdminNavbar();

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center justify-end gap-6">
      <div
        onClick={handleAccountClick}
        className="flex items-center gap-3 cursor-pointer group"
      >
        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-300 group-hover:ring-2 group-hover:ring-blue-400 transition-all">
          {userInfo.avatar ? (
            <img
              src={userInfo.avatar}
              alt={userInfo.name || "avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold text-sm">
              {userInfo.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="font-medium text-gray-800">{userInfo.name || "Chưa đăng nhập"}</span>
          <span className="text-sm text-gray-500">{userInfo.roleLabel}</span>
        </div>
      </div>
    </nav>
  );
};




// "use client";
// import React from "react";
// import { User } from "lucide-react";
// import { useAdminNavbar } from "@/features/auth/useAdminNavbar.hook";

// export const AdminNavbar: React.FC = () => {
//   const { user, roleLabel, handleAccountClick} = useAdminNavbar();

//   return (
//     <nav className="bg-white shadow px-6 py-3 flex items-center justify-end gap-4">
//       <div
//         onClick={handleAccountClick}
//         className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
//       >
//         <User size={18} />
//         <span>
//           {user?.username || "Chưa đăng nhập"} ({roleLabel})
//         </span>
//       </div>
//     </nav>
//   );
// };
