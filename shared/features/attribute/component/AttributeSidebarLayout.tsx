
// shared/features/attribute/AttributeSidebarLayout.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { SidebarLayout, Input, GradientButton, formatVNDate} from "@shared/core";
import { useAttribute, Attribute } from "@shared/features/attribute";
import { CardAttributeValue } from "./CardAttributeValue";
import { Calendar, Activity, Eye, Edit2, Trash2, Plus, Zap, Shapes, Tags} from "lucide-react";
import { AttributeHeader } from "./AttributeHeader";

interface AttributeSidebarLayoutProps {
    searchQuery?: string;
    onCreateClick?: () => void;
    createClicked?: boolean;
    setCreateClicked?: (val: boolean) => void;
}

export const AttributeSidebarLayout: React.FC<AttributeSidebarLayoutProps> = ({
    searchQuery = "",
    onCreateClick,
    createClicked,
    setCreateClicked,
}) => {
    const {
        adminAttributes,
        loadingAdmin,
        getAdminAttributes,
        searchAdminAttributes,
        reloadAdminAttributes,
    } = useAttribute();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false); // quản lý chế độ chỉnh sửa
    // ================= Fetch tất cả khi mount =================
    useEffect(() => {
        getAdminAttributes();
    }, [getAdminAttributes]);

    // ================= Khi searchQuery thay đổi =================

    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length) {
            // chỉ search
            searchAdminAttributes({ query });
        } else {
            // rỗng => lấy tất cả
            getAdminAttributes();
        }
    }, [searchQuery, getAdminAttributes, searchAdminAttributes]);
    
    // ================= Sidebar items =================
    const attributes = adminAttributes?.attributes || [];
    const sidebarItems = useMemo(
        () => attributes.map(attr => ({ id: attr._id, label: attr.label })),
        [attributes]
    );

    // ================= Chọn item mặc định =================
    useEffect(() => {
        const ids = attributes.map(a => a._id);

        if (!ids.length) {
            // danh sách trống => bỏ chọn
            setSelectedId(null);
        } else if (!ids.includes(selectedId!)) {
            // selectedId cũ không có trong danh sách mới => chọn đầu tiên
            setSelectedId(ids[0]);
        }
    }, [attributes]); // chỉ cần attributes

    const selectedAttribute = useMemo(
        () => attributes.find(a => a._id === selectedId) || null,
        [attributes, selectedId]
    );

    // ================= Debug state =================
    const renderContent = () => {
        if (loadingAdmin)
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
                </div>
            );

        if (!selectedAttribute) return <p>Chọn một thuộc tính để xem chi tiết</p>;

        return (
        <div className="space-y-6">
            {/* Header */}
            <AttributeHeader attribute={selectedAttribute} onUpdated={reloadAdminAttributes}/>

            {/* Info */}
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
                <p className="font-semibold flex items-center gap-1 text-indigo-600">
                <Calendar className="w-4 h-4" /> Ngày tạo
                </p>
                <p className="font-medium text-gray-800">{formatVNDate(selectedAttribute.createdAt)}</p>
            </div>
            <div>
                <p className="font-semibold flex items-center gap-1 text-indigo-600">
                <Activity className="w-4 h-4" /> Cập nhật lần cuối
                </p>
                <p className="font-medium text-gray-800">{formatVNDate(selectedAttribute.updatedAt)}</p>
            </div>
                <div>
                <p className="font-semibold flex items-center gap-1 text-indigo-600">
                    <Zap className="w-4 h-4" /> Trạng thái
                </p>
                <p className={`font-medium flex items-center gap-1 ${selectedAttribute.isActive ? "text-green-600" : "text-red-600"}`}>
                    {selectedAttribute.isActive ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-green-600 block" /> Hoạt động
                    </>
                    ) : (
                    <>
                        <span className="w-2 h-2 rounded-full bg-red-600 block" /> Không hoạt động
                    </>
                    )}
                </p>
                </div>

            <div>
                <p className="font-semibold flex items-center gap-1 text-indigo-600">
                Global
                </p>
                <p className="font-medium text-gray-800">{selectedAttribute.isGlobal ? "Yes" : "No"}</p>
            </div>
            </div>

            <hr />
            {/* Buttons Add / Edit */}
            <div className="flex gap-2 justify-end mt-4">
                <h2 className="text-lg font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2 mr-auto">
                    <Tags className="w-4 h-4 text-indigo-600" />
                    Giá trị thuộc tính

                    <span className="absolute left-0 -bottom-1 w-64 h-[1px] bg-indigo-700 rounded-full"></span>
                </h2>


                <GradientButton
                    label="Thêm giá trị"
                    icon={Plus}
                    gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
                    hoverGradient="hover:from-green-600 hover:to-emerald-700"
                />
                <GradientButton
                    label={editMode ? "Thoát chỉnh sửa" : "Sửa giá trị"}
                    icon={Edit2}
                    gradient="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
                    hoverGradient="hover:from-blue-600 hover:to-indigo-700"
                    onClick={() => setEditMode(prev => !prev)}
                />
            </div>
            
            {/* Grid Values */}
            {selectedAttribute.values?.length ? (
            <div
                className={`grid ${
                editMode
                    ? "grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
                    : "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
                } justify-center`}
            >
                {selectedAttribute.values.map(value => (
                <CardAttributeValue
                    key={value._id}
                    value={value}
                    mini={!editMode}
                    compact={false}
                    showActions={editMode}
                    showStatus={editMode}
                    onEdit={() => console.log("Edit", value._id)}
                    onHide={() => console.log("Hide", value._id)}
                    onDelete={() => console.log("Delete", value._id)}
                />
                ))}
            </div>
            ) : (
            <p className="text-gray-400">Chưa có giá trị nào</p>
            )}
        </div>
        );
    };

    return <SidebarLayout 
    items={sidebarItems}
    selectedId={selectedId ?? undefined}
    onSelect={id => setSelectedId(id)}
    renderContent={renderContent}
    // renderContent={(item) => renderContent(item ? { id: item.id, label: item.label } : null)}
            />;
};



// // shared/features/attribute/AttributeSidebarLayout.tsx
// "use client";

// import React, { useEffect, useState, useMemo } from "react";
// import { SidebarLayout, Input, GradientButton, formatVNDate} from "@shared/core";
// import { useAttribute, Attribute } from "@shared/features/attribute";
// import { CardAttributeValue } from "./CardAttributeValue";
// import { Calendar, Activity, Eye, Edit2, Trash2, Plus, Zap, Shapes, Tags} from "lucide-react";
// import { AttributeHeader } from "./AttributeHeader";

// interface AttributeSidebarLayoutProps {
//     searchQuery?: string;
// }

// export const AttributeSidebarLayout: React.FC<AttributeSidebarLayoutProps> = ({
//     searchQuery = "",
// }) => {
//     const { adminAttributesState, getAdminAttributes, searchAdminAttributes} = useAttribute();
//     const [editMode, setEditMode] = useState(false); // quản lý chế độ chỉnh sửa
//     const [selectedId, setSelectedId] = useState<string | null>(null);

//     // Fetch tất cả khi mount
//     useEffect(() => {
//         getAdminAttributes();
//     }, []);//getAdminAttributes

//     // Khi searchQuery thay đổi
//     useEffect(() => {
//         // if (searchQuery.trim() !== "") {
//         // searchAdminAttributes({ query: searchQuery });
//         // }
//         const query = searchQuery.trim();
//         if (query) {
//             searchAdminAttributes({ query });
//         } else {
//             getAdminAttributes(); // load lại toàn bộ khi search rỗng
//         }
//     }, [searchQuery]);//searchQuery, searchAdminAttributes

//     const attributes = adminAttributesState.data?.attributes || [];
//     const sidebarItems = useMemo(() => 
//         attributes.map(attr => ({ id: attr._id, label: attr.label })), 
//         [attributes]
//     );

    

//     useEffect(() => {
//         if (!selectedId && sidebarItems.length) setSelectedId(sidebarItems[0].id);
//         else if (selectedId && !sidebarItems.find(item => item.id === selectedId)) {
//             setSelectedId(sidebarItems[0]?.id ?? null);
//         }
//     }, [sidebarItems, selectedId]);

//     const selectedAttribute = useMemo(() => 
//         attributes.find(a => a._id === selectedId) || null,
//         [attributes, selectedId]
//     );


//     // const renderContent = (selectedItem: { id: string; label: string } | null) => {
//     //     if (adminAttributesState.loading)
//     //     return (
//     //         <div className="flex justify-center items-center h-full">
//     //         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
//     //         </div>
//     //     );

//     //     if (!selectedItem) return <p>Chọn một thuộc tính để xem chi tiết</p>;
//     //     const attribute = attributes.find(a => a._id === selectedItem.id) as Attribute | undefined;
//     //     if (!attribute) return <p>Không tìm thấy attribute</p>;

//     //     return (
//     useEffect(() => {
//         console.log("🔥 STATE CHANGED(LAYOUT):", adminAttributesState.data);
//     }, [adminAttributesState.data]);
//     useEffect(() => {
//         console.log("🔥 Admin attributes changed:", attributes);
//     }, [attributes]);
    
//     console.log("->Render attributes:", attributes);
    
//     const renderContent = () => {
//         if (adminAttributesState.loading)
//             return (
//                 <div className="flex justify-center items-center h-full">
//                 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
//                 </div>
//             );
//         if (!selectedAttribute) return <p>Chọn một thuộc tính để xem chi tiết</p>;

//         const attribute = selectedAttribute;
//         return (
//         <div className="space-y-6">
//             {/* Header */}
//             <AttributeHeader attribute={attribute} />

//             {/* Info */}
//             <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                 <Calendar className="w-4 h-4" /> Ngày tạo
//                 </p>
//                 <p className="font-medium text-gray-800">{formatVNDate(attribute.createdAt)}</p>
//             </div>
//             <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                 <Activity className="w-4 h-4" /> Cập nhật lần cuối
//                 </p>
//                 <p className="font-medium text-gray-800">{formatVNDate(attribute.updatedAt)}</p>
//             </div>
//                 <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                     <Zap className="w-4 h-4" /> Trạng thái
//                 </p>
//                 <p className={`font-medium flex items-center gap-1 ${attribute.isActive ? "text-green-600" : "text-red-600"}`}>
//                     {attribute.isActive ? (
//                     <>
//                         <span className="w-2 h-2 rounded-full bg-green-600 block" /> Hoạt động
//                     </>
//                     ) : (
//                     <>
//                         <span className="w-2 h-2 rounded-full bg-red-600 block" /> Không hoạt động
//                     </>
//                     )}
//                 </p>
//                 </div>

//             <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                 Global
//                 </p>
//                 <p className="font-medium text-gray-800">{attribute.isGlobal ? "Yes" : "No"}</p>
//             </div>
//             </div>

//             <hr />
//             {/* Buttons Add / Edit */}
//             <div className="flex gap-2 justify-end mt-4">
//                 <h2 className="text-lg font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2 mr-auto">
//                     <Tags className="w-4 h-4 text-indigo-600" />
//                     Giá trị thuộc tính

//                     <span className="absolute left-0 -bottom-1 w-64 h-[1px] bg-indigo-700 rounded-full"></span>
//                 </h2>


//                 <GradientButton
//                     label="Thêm giá trị"
//                     icon={Plus}
//                     gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
//                     hoverGradient="hover:from-green-600 hover:to-emerald-700"
//                 />
//                 <GradientButton
//                     label={editMode ? "Thoát chỉnh sửa" : "Sửa giá trị"}
//                     icon={Edit2}
//                     gradient="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
//                     hoverGradient="hover:from-blue-600 hover:to-indigo-700"
//                     onClick={() => setEditMode(prev => !prev)}
//                 />
//             </div>
            
//             {/* Grid Values */}
//             {attribute.values?.length ? (
//             <div
//                 className={`grid ${
//                 editMode
//                     ? "grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
//                     : "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
//                 } justify-center`}
//             >
//                 {attribute.values.map(value => (
//                 <CardAttributeValue
//                     key={value._id}
//                     value={value}
//                     mini={!editMode}
//                     compact={false}
//                     showActions={editMode}
//                     showStatus={editMode}
//                     onEdit={() => console.log("Edit", value._id)}
//                     onHide={() => console.log("Hide", value._id)}
//                     onDelete={() => console.log("Delete", value._id)}
//                 />
//                 ))}
//             </div>
//             ) : (
//             <p className="text-gray-400">Chưa có giá trị nào</p>
//             )}
//         </div>
//         );
//     };

//     return <SidebarLayout 
//     items={sidebarItems}
//     selectedId={selectedId ?? undefined}
//     onSelect={setSelectedId}
//     renderContent={renderContent}
//     // renderContent={(item) => renderContent(item ? { id: item.id, label: item.label } : null)}
//             />;
// };


// // shared/features/attribute/AttributeSidebarLayout.tsx
// "use client";

// import React, { useEffect, useState } from "react";
// import { SidebarLayout, Input, GradientButton, formatVNDate} from "@shared/core";
// import { useAttribute, Attribute } from "@shared/features/attribute";
// import { CardAttributeValue } from "./CardAttributeValue";
// import { Calendar, Activity, Eye, Edit2, Trash2, Plus, Zap, Shapes, Tags} from "lucide-react";

// interface AttributeSidebarLayoutProps {
//     searchQuery?: string;
// }

// export const AttributeSidebarLayout: React.FC<AttributeSidebarLayoutProps> = ({
//     searchQuery = "",
// }) => {
//     const { adminAttributesState, getAdminAttributes, searchAdminAttributes, updateAdminAttributeLabel, deleteAttribute, toggleAttributeStatus, } = useAttribute();
//     const [editMode, setEditMode] = useState(false); // quản lý chế độ chỉnh sửa
//     const [selectedId, setSelectedId] = useState<string | null>(null);

//     // Fetch tất cả khi mount
//     useEffect(() => {
//         getAdminAttributes();
//     }, []);//getAdminAttributes

//     // Khi searchQuery thay đổi
//     useEffect(() => {
//         if (searchQuery.trim() !== "") {
//         searchAdminAttributes({ query: searchQuery });
//         }
//     }, []);//searchQuery, searchAdminAttributes

//     const attributes = adminAttributesState.data?.attributes || [];
//     const sidebarItems = attributes.map(attr => ({ id: attr._id, label: attr.label }));

//       // Khi items load xong, chọn mặc định item đầu tiên
//     useEffect(() => {
//         if (sidebarItems.length && !selectedId) {
//         setSelectedId(sidebarItems[0].id);
//         }
//     }, [sidebarItems, selectedId]);

//     const renderContent = (selectedItem: { id: string; label: string } | null) => {
//         if (adminAttributesState.loading)
//         return (
//             <div className="flex justify-center items-center h-full">
//             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
//             </div>
//         );

//         if (!selectedItem) return <p>Chọn một thuộc tính để xem chi tiết</p>;
//         const attribute = attributes.find(a => a._id === selectedItem.id) as Attribute | undefined;
//         if (!attribute) return <p>Không tìm thấy attribute</p>;

//         return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex justify-between items-center">
//                 <h2 className="text-2xl font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2">
//                     <Shapes className="w-6 h-6 text-indigo-500" />
//                     {attribute.label}

//                     <span className="absolute left-0 -bottom-1 w-80 h-[1px] bg-indigo-700  rounded-full"></span>
//                 </h2>


//                 <div className="flex gap-2">
//                     <GradientButton
//                     label="Ẩn"
//                     icon={Eye}
//                     gradient="bg-gradient-to-r from-gray-400 to-gray-500"
//                     hoverGradient="hover:from-gray-300 hover:to-gray-400"
//                     // roundedFull={false}
//                     />
//                     <GradientButton
//                     label="Sửa"
//                     icon={Edit2}
//                     gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
//                     hoverGradient="hover:from-blue-600 hover:to-indigo-700"
//                     // roundedFull={false}
//                     />
//                     <GradientButton
//                     label="Xóa"
//                     icon={Trash2}
//                     gradient="bg-gradient-to-r from-red-500 to-pink-600"
//                     hoverGradient="hover:from-red-600 hover:to-pink-700"
//                     // roundedFull={false}
//                     />
//                 </div>
//             </div>

//             {/* Info */}
//             <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                 <Calendar className="w-4 h-4" /> Ngày tạo
//                 </p>
//                 <p className="font-medium text-gray-800">{formatVNDate(attribute.createdAt)}</p>
//             </div>
//             <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                 <Activity className="w-4 h-4" /> Cập nhật lần cuối
//                 </p>
//                 <p className="font-medium text-gray-800">{formatVNDate(attribute.updatedAt)}</p>
//             </div>
//                 <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                     <Zap className="w-4 h-4" /> Trạng thái
//                 </p>
//                 <p className={`font-medium flex items-center gap-1 ${attribute.isActive ? "text-green-600" : "text-red-600"}`}>
//                     {attribute.isActive ? (
//                     <>
//                         <span className="w-2 h-2 rounded-full bg-green-600 block" /> Hoạt động
//                     </>
//                     ) : (
//                     <>
//                         <span className="w-2 h-2 rounded-full bg-red-600 block" /> Không hoạt động
//                     </>
//                     )}
//                 </p>
//                 </div>

//             <div>
//                 <p className="font-semibold flex items-center gap-1 text-indigo-600">
//                 Global
//                 </p>
//                 <p className="font-medium text-gray-800">{attribute.isGlobal ? "Yes" : "No"}</p>
//             </div>
//             </div>

//             <hr />
//             {/* Buttons Add / Edit */}
//             <div className="flex gap-2 justify-end mt-4">
//                 <h2 className="text-lg font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2 mr-auto">
//                     <Tags className="w-4 h-4 text-indigo-600" />
//                     Giá trị thuộc tính

//                     <span className="absolute left-0 -bottom-1 w-64 h-[1px] bg-indigo-700 rounded-full"></span>
//                 </h2>


//                 <GradientButton
//                     label="Thêm giá trị"
//                     icon={Plus}
//                     gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
//                     hoverGradient="hover:from-green-600 hover:to-emerald-700"
//                 />
//                 <GradientButton
//                     label={editMode ? "Thoát chỉnh sửa" : "Sửa giá trị"}
//                     icon={Edit2}
//                     gradient="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
//                     hoverGradient="hover:from-blue-600 hover:to-indigo-700"
//                     onClick={() => setEditMode(prev => !prev)}
//                 />
//             </div>
            
//             {/* Grid Values */}
//             {attribute.values?.length ? (
//             <div
//                 className={`grid ${
//                 editMode
//                     ? "grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
//                     : "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
//                 } justify-center`}
//             >
//                 {attribute.values.map(value => (
//                 <CardAttributeValue
//                     key={value._id}
//                     value={value}
//                     mini={!editMode}
//                     compact={false}
//                     showActions={editMode}
//                     showStatus={editMode}
//                     onEdit={() => console.log("Edit", value._id)}
//                     onHide={() => console.log("Hide", value._id)}
//                     onDelete={() => console.log("Delete", value._id)}
//                 />
//                 ))}
//             </div>
//             ) : (
//             <p className="text-gray-400">Chưa có giá trị nào</p>
//             )}
//         </div>
//         );
//     };

//     return <SidebarLayout 
//     items={sidebarItems}
//     selectedId={selectedId ?? undefined}
//     onSelect={setSelectedId}
//     renderContent={(item) => renderContent(item ? { id: item.id, label: item.label } : null)}
//             />;
// };
