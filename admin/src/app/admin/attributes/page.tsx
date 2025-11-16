"use client";

import React, { useState, useEffect } from "react";
import { AttributeSidebarLayout } from "@shared/features/attribute";
import { SearchHeader, GradientButton } from "@shared/core";
import { useAttribute } from "@shared/features/attribute/attribute.hook";
import { Plus } from "lucide-react";

export default function AttributePage() {
    const { getAdminAttributes, searchAdminAttributes } = useAttribute();
    const [search, setSearch] = useState("");
    const [createClicked, setCreateClicked] = useState(false);

    // Fetch danh sách attributes khi mount
    useEffect(() => {
        getAdminAttributes();
    }, [getAdminAttributes]);

    // Tìm kiếm khi search thay đổi
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
        searchAdminAttributes({ query: search });
        }, 300); // debounce 300ms

        return () => clearTimeout(delayDebounce);
    }, [search, searchAdminAttributes]);

    return (
        <div className="p-6 space-y-4 h-screen flex flex-col">
            {/* Header với search */}
            <SearchHeader
                title="THUỘC TÍNH TOÀN HỆ THỐNG"
                searchPlaceholder="Tìm kiếm thuộc tính..."
                searchValue={search}
                onSearchChange={setSearch}
            />
            {/* Nút tạo nằm bên phải dưới search */}
            <div className="flex justify-end">
                <GradientButton
                    label="Tạo thuộc tính"
                    icon={Plus}
                    gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
                    hoverGradient="hover:from-green-600 hover:to-emerald-700"
                    onClick={() => setCreateClicked(true)}
                />
            </div>

            {/* Sidebar + Content */}
            <div className="flex-1 min-h-0">
                <AttributeSidebarLayout
                searchQuery={search} // truyền search xuống sidebar layout
                onCreateClick={() => setCreateClicked(true)}
                createClicked={createClicked}
                setCreateClicked={setCreateClicked}
                />
            </div>
        </div>
    );
}



// "use client";

// import { useState, useEffect } from "react";
// import { AttributeManagementLayout } from "@shared/features/attribute/AttributeManagementLayout";
// import { Button } from "@/components/ui/Button";
// import { Plus, X } from "lucide-react";
// import { useRouter } from "next/navigation";

// import { useAttribute } from "@shared/features/attribute/attribute.hook";

// export default function AttributePage() {
//     const router = useRouter();
//     const { adminAttributesState, searchAdminAttributes, getAttributeById, publicAttributeState } = useAttribute();

//     const [search, setSearch] = useState("");
//     const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);

//     // ===== FETCH ATTRIBUTES =====
//     useEffect(() => {
//         searchAdminAttributes({ query: search });
//     }, [search, searchAdminAttributes]);

//     // ===== FETCH DETAIL =====
//     useEffect(() => {
//         if (selectedAttributeId) {
//             getAttributeById(selectedAttributeId);
//         }
//     }, [selectedAttributeId, getAttributeById]);

//     return (
//         <AttributeManagementLayout
//             title="Quản lý thuộc tính"
//             searchPlaceholder="Tìm kiếm thuộc tính..."
//             searchValue={search}
//             onSearchChange={setSearch}
//         >
//             {/* ===== Header Table Actions ===== */}
//             <div className="flex justify-between items-center mb-4">
//                 <div className="text-gray-600 text-sm">
//                     Tổng: <b>{adminAttributesState.data?.items?.length ?? 0}</b> thuộc tính
//                 </div>

//                 <Button
//                     onClick={() => router.push("/attributes/create")}
//                     className="rounded-xl flex items-center gap-2 px-4 py-2"
//                 >
//                     <Plus size={18} />
//                     Tạo thuộc tính
//                 </Button>
//             </div>

//             {/* ===== TABLE ===== */}
//             <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-md">
//                 <table className="w-full border-collapse">
//                     <thead className="bg-gray-50 border-b">
//                         <tr>
//                             <th className="p-4 text-left text-gray-700 font-medium">Tên thuộc tính</th>
//                             <th className="p-4 text-left text-gray-700 font-medium">Số value</th>
//                             <th className="p-4 text-right text-gray-700 font-medium">Thao tác</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {adminAttributesState.loading ? (
//                             <tr>
//                                 <td colSpan={3} className="p-6 text-center text-gray-400">
//                                     Đang tải...
//                                 </td>
//                             </tr>
//                         ) : !adminAttributesState.data?.items?.length ? (
//                             <tr>
//                                 <td colSpan={3} className="p-6 text-center text-gray-400">
//                                     Không có dữ liệu
//                                 </td>
//                             </tr>
//                         ) : (
//                             adminAttributesState.data.items.map(attr => (
//                                 <tr
//                                     key={attr._id ?? attr.label}
//                                     className="border-b last:border-none hover:bg-gray-50 transition"
//                                 >
//                                     <td className="p-4 text-gray-800 font-medium">{attr.label}</td>
//                                     <td className="p-4 text-gray-600">{attr.values?.length ?? 0}</td>
//                                     <td className="p-4 text-right">
//                                         <Button
//                                             variant="outline"
//                                             className="rounded-xl text-sm"
//                                             onClick={() => setSelectedAttributeId(attr._id)}
//                                         >
//                                             Chi tiết
//                                         </Button>
//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>

//             {/* ===== MODAL / DETAIL VIEW ===== */}
//             {selectedAttributeId && publicAttributeState.data && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//                     <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] relative">
//                         <button
//                             className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
//                             onClick={() => setSelectedAttributeId(null)}
//                         >
//                             <X size={20} />
//                         </button>

//                         <h3 className="text-xl font-semibold mb-4">
//                             Chi tiết: {publicAttributeState.data.label}
//                         </h3>

//                         <div className="text-gray-600 text-sm">
//                             <p>
//                                 <b>ID:</b> {publicAttributeState.data._id}
//                             </p>
//                             <p>
//                                 <b>Trạng thái:</b>{" "}
//                                 {publicAttributeState.data.isActive ? "Hoạt động" : "Tạm dừng"}
//                             </p>
//                             <p>
//                                 <b>Global:</b> {publicAttributeState.data.isGlobal ? "Có" : "Không"}
//                             </p>
//                             <p className="mt-2 font-medium">Các giá trị:</p>
//                             <ul className="list-disc pl-5 mt-1">
//                                 {publicAttributeState.data.values?.map(v => (
//                                     <li key={v._id}>{v.value}</li>
//                                 )) || <li>Chưa có giá trị</li>}
//                             </ul>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </AttributeManagementLayout>
//     );
// }
