

"use client";

import React, { useState, useEffect }  from "react";
import { Input, GradientButton, Table, buildFormDataForAttributeValues } from "@shared/core";
import { Plus, Trash2, X, Check, Image,  Shapes, Hash, Settings2, Tags, CreditCard, Edit2} from "lucide-react";
import { useAttribute } from "@shared/features/attribute";

interface NewValueRow {
    id: string;
    value: string;
    file?: File | null;
    previewUrl?: string | null;
}

export const CreateAttributePanel: React.FC<{
    onCancel: () => void;
    onSave: () => void;
}> = ({ onCancel, onSave }) => {
    const { createShopAttribute } = useAttribute();
    
    const [label, setLabel] = useState("");
    // --- DEFAULT 3 ROWS ---
    const [rows, setRows] = useState<NewValueRow[]>([
        { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
        { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
        { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
    ]);

    const [saving, setSaving] = useState(false);
    useEffect(() => {
        return () => {
        rows.forEach(r => r.previewUrl && URL.revokeObjectURL(r.previewUrl));
        };
    }, []);

    const addRow = () => setRows(prev => [...prev, { id: crypto.randomUUID(), value: "", file: null, previewUrl: null }]);
    const deleteRow = (id: string) => {
        setRows(prev => {
            const row = prev.find(r => r.id === id);
            if (row?.previewUrl) URL.revokeObjectURL(row.previewUrl);
            return prev.filter(r => r.id !== id);
        });
    };
    const updateRow = (id: string, field: keyof NewValueRow, value: any) => {
        setRows(prev =>
        prev.map(r => {
            if (r.id !== id) return r;

            // Nếu file mới, tạo previewUrl mới
            if (field === "file") {
                if (r.previewUrl) URL.revokeObjectURL(r.previewUrl);
                return { ...r, file: value, previewUrl: value ? URL.createObjectURL(value) : null };
            }
            return { ...r, [field]: value };
        })
        );
    };

    // --- Lưu Attribute ---
    const handleSave = async () => {
        if (!label.trim() || saving) return;

        setSaving(true);
        try {
        const formData = buildFormDataForAttributeValues(rows, { label });
        const res = await createShopAttribute(formData);

        if (res.success) {
            onSave(); // đóng panel
            // Reset form để tạo liên tiếp nếu cần
            setLabel("");
            rows.forEach(r => r.previewUrl && URL.revokeObjectURL(r.previewUrl));
            setRows([
            { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
            { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
            { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
            ]);
        }
        } finally {
        setSaving(false);
        }
    };

    // --- COLUMNS ---
    const columns = [
        {
            key: "value",
            title: "Giá trị",
            icon: Tags,
            iconColor: "text-indigo-600",
            width: 200,
            align: "center" as const,
            render: (row: NewValueRow) => (
                <Input
                    value={row.value}
                    onChange={(e) =>
                        updateRow(row.id, "value", e.target.value)
                    }
                    className="
                        border-indigo-300
                        focus:border-indigo-500
                        focus:ring-indigo-500
                        rounded-xl
                        px-3 py-2
                        text-indigo-700
                    "
                    placeholder="Nhập giá trị..."
                />
            ),
        },
        {
            key: "file",
            title: "Ảnh thuộc tính",
            icon: Image,
            iconColor: "text-indigo-600",
            width: 200,
            align: "center" as const,
            // render: (row: NewValueRow) => {
            //     const file = row.file;
            //     const previewUrl = file ? URL.createObjectURL(file) : null;

            //     return (
            //         // GIỮ CENTER TOÀN CỘT
            //         <div className="flex flex-col items-center w-full">

            //             {/* Nhóm ảnh + tên + nút (căn trái trong nhóm) */}
            //             <div className="flex items-center gap-3">

            //                 {/* Preview ảnh */}
            //                 <div className="flex-shrink-0">
            //                     {previewUrl ? (
            //                         <img
            //                             src={previewUrl}
            //                             alt="preview"
            //                             className="w-12 h-12 rounded-md object-cover shadow-sm border"
            //                         />
            //                     ) : (
            //                         <div className="w-12 h-12 rounded-md border bg-gray-100 
            //                             flex items-center justify-center text-gray-400 text-xs">
            //                             No img
            //                         </div>
            //                     )}
            //                 </div>

            //                 {/* Tên file + nút chọn ảnh + nút xoá */}
            //                 <div className="flex flex-col gap-1">

            //                     {/* Tên file */}
            //                     {file && (
            //                         <div className="flex items-center gap-2">
            //                             <span className="text-xs text-indigo-700 max-w-[120px] truncate">
            //                                 {file.name}
            //                             </span>

            //                             {/* Nút X xoá ảnh */}
            //                             <button
            //                                 className="text-red-600 hover:text-red-800 text-xs p-0.5 rounded-full"
            //                                 onClick={() => updateRow(row.id, "file", null)}
            //                                 title="Xoá ảnh"
            //                             >
            //                                 ✕
            //                             </button>
            //                         </div>
            //                     )}

            //                     {/* Nút chọn ảnh */}
            //                     <label
            //                         className="
            //                             px-3 py-1 
            //                             bg-gradient-to-r from-indigo-500 to-blue-600
            //                             text-white font-semibold text-xs rounded-full
            //                             cursor-pointer hover:from-indigo-600 hover:to-blue-700
            //                             transition flex items-center justify-center gap-1 shadow-sm
            //                             "
            //                     >
            //                         <Plus className="w-3 h-3" />
            //                         Chọn ảnh
            //                         <input
            //                             type="file"
            //                             accept="image/*"
            //                             className="hidden"
            //                             onChange={(e) =>
            //                                 updateRow(row.id, "file", e.target.files?.[0] || null)
            //                             }
            //                         />
            //                     </label>

            //                 </div>

            //             </div>
            //         </div>
            //     );
            // }
            render: (row: NewValueRow) => (
                <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                    {row.previewUrl ? (
                        <img
                        src={row.previewUrl}
                        alt="preview"
                        className="w-12 h-12 rounded-md object-cover shadow-sm border"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-md border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No img
                        </div>
                    )}
                    </div>

                    <div className="flex flex-col gap-1">
                    {row.file && (
                        <div className="flex items-center gap-2">
                        <span className="text-xs text-indigo-700 max-w-[120px] truncate">{row.file.name}</span>
                        <button
                            className="text-red-600 hover:text-red-800 text-xs p-0.5 rounded-full"
                            onClick={() => updateRow(row.id, "file", null)}
                            title="Xoá ảnh"
                        >
                            ✕
                        </button>
                        </div>
                    )}

                    <label className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold text-xs rounded-full cursor-pointer hover:from-indigo-600 hover:to-blue-700 transition flex items-center justify-center gap-1 shadow-sm">
                        <Plus className="w-3 h-3" />
                        Chọn ảnh
                        <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => updateRow(row.id, "file", e.target.files?.[0] || null)}
                        />
                    </label>
                    </div>
                </div>
                </div>
            ),
        },
        {
            key: "actions",
            title: "Hành động",
            icon: Settings2,
            iconColor: "text-indigo-600",
            width: 120,
            align: "center" as const,
            render: (row: NewValueRow) => (
                <button
                    className="
                        flex items-center gap-1
                        bg-gradient-to-r from-red-500 via-red-600 to-red-700
                        text-white 
                        px-3 py-1 rounded-full
                        hover:from-red-600 hover:via-red-700 hover:to-red-800
                        transition
                        shadow-sm
                    "
                    onClick={() => deleteRow(row.id)}
                >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                </button>
            )

        },
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">

                <h2 className="flex items-center gap-2 text-2xl font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative">
                    Tạo thuộc tính<Edit2 className="ml-2 w-6 h-6 text-indigo-500" />
                    
                    <span className="absolute left-0 -bottom-1 w-60 h-[1px] bg-indigo-700 rounded-full"></span>
                </h2>


                {/* Buttons */}
                <div className="flex items-center gap-3">

                    {/* Thêm dòng nằm ở đây */}
                    <GradientButton
                        label="Thêm dòng"
                        icon={Plus}
                        gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
                        hoverGradient="hover:from-green-600 hover:to-emerald-700"
                        onClick={addRow}
                    />

                    <GradientButton
                        label="Hủy"
                        icon={X}
                        gradient="bg-gradient-to-r from-gray-400 to-gray-500"
                        hoverGradient="hover:from-gray-300 hover:to-gray-400"
                        onClick={onCancel}
                    />

                    <GradientButton
                        label={saving ? "Đang lưu..." : "Lưu"}
                        icon={Check}
                        gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
                        hoverGradient="hover:from-blue-600 hover:to-indigo-700"
                        onClick={handleSave}
                        disabled={!label.trim() || saving}
                    />
                </div>
            </div>

            {/* Input tên thuộc tính — nằm bên trái */}
            <div className="w-[320px]">
                <label className="font-semibold text-indigo-600 flex items-center gap-2">
                    <Shapes className="w-5 h-5 text-indigo-500" />
                    Tên thuộc tính
                </label>
                <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                        <Hash className="w-4 h-4" />
                    </span>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Nhập tên thuộc tính..."
                        className="pl-10 rounded-xl border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                </div>
            </div>


            {/* Table */}
            <div className="mt-4">
                <Table
                    columns={columns}
                    data={rows}
                    showIndex
                    rowsPerPage = {5}
                    sttIconColor="text-indigo-600"                
                    headerColor="bg-gradient-to-r from-blue-100 via-indigo-200 to-pink-100 text-indigo-600 font-extrabold tracking-wider shadow-md"
                    paginationBg="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
                    paginationActiveColor="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-white font-semibold shadow-md"
                    paginationTextColor="text-indigo-600 font-medium"
                    paginationHoverColor="hover:bg-gradient-to-r hover:from-blue-100 hover:via-indigo-150 hover:to-purple-100"
                />
            </div>
        </div>
    );
};
