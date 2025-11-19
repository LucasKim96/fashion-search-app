"use client";

import React from "react";
import { AdminSidebar, AdminNavbar, AdminMain, NotificationProvider} from "@shared/core";
import { ProtectedRoute } from "@shared/features/auth";
import { adminMenuItems } from "@/constants/adminMenu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <ProtectedRoute requiredRole={["ADMIN", "SUPER_ADMIN"]} redirectTo="/login">
        {/* Bố cục chia 2 cột: sidebar + phần nội dung */}
        <div className="grid grid-cols-[auto,1fr] h-screen overflow-hidden bg-gray-100">
          {/* Sidebar cố định */}
          <div className="sticky top-0 h-screen z-30">
            <AdminSidebar menuItems={adminMenuItems} />
          </div>

          {/* Phần bên phải: Navbar cố định, Main cuộn */}
          <div className="flex flex-col h-screen relative z-10">
            {/* Navbar cố định */}
            <div className="sticky top-0 z-20">
              <AdminNavbar profilePath="/admin/profile"/>
            </div>

            {/* Main: phần duy nhất có thể cuộn */}
            <div className="flex-1 overflow-y-auto">
              <AdminMain>{children}</AdminMain>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </NotificationProvider>
  );
}

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <NotificationProvider>
//       {/* Bảo vệ toàn bộ khu vực admin */}
//       <ProtectedRoute requiredRole={["ADMIN", "SUPER_ADMIN"]} redirectTo="/admin/login">
//         <div className="flex min-h-screen bg-gray-100">
//           <AdminSidebar />
//           <section className="flex-1 flex flex-col transition-all duration-300">
//             <AdminNavbar />
//             <AdminMain>{children}</AdminMain>
//           </section>
//         </div>
//       </ProtectedRoute>
//     </NotificationProvider>
//   );
// }
