

"use client";

import React, { useState, useEffect }  from "react";
import { Input, GradientButton, Table, buildFormDataForAttributeValues } from "@shared/core";
import { Plus, Trash2, X, Check, Image, Settings2, Tags } from "lucide-react";
import { useAttributeValue, Attribute} from "@shared/features/attribute";

interface NewValueRow {
    id: string;
    value: string;
    file?: File | null;
    previewUrl?: string | null;
}

export const CreateAttributeValue: React.FC<{
    onCancel: () => void;
    onSave: () => void;
    attribute: Attribute;
}> = ({ onCancel, onSave, attribute}) => {
    const { createAdminAttributeValues } = useAttributeValue();
    const [saving, setSaving] = useState(false);

    // --- DEFAULT 3 ROWS ---
    const [rows, setRows] = useState<NewValueRow[]>([
        { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
        { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
        { id: crypto.randomUUID(), value: "", file: null, previewUrl: null },
    ]);

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
        setSaving(true);
        try {
            const formData = buildFormDataForAttributeValues(rows);
            const res = await createAdminAttributeValues(attribute._id, formData);

        if (res.success) {
            onSave(); // đóng panel
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
            {/* Buttons */}
                <div className="flex items-center justify-between gap-3">
                    {/* Dòng tiêu đề bên trái */}
                    <h2 className="text-lg font-semibold uppercase text-indigo-600 tracking-wide drop-shadow-sm relative inline-flex items-center gap-2">
                        <Tags className="w-4 h-4 text-indigo-600" />
                        Thêm giá trị mới
                        <span className="absolute left-0 -bottom-1 w-64 h-[1px] bg-indigo-700 rounded-full"></span>
                    </h2>


                    {/* Các nút bấm bên phải */}
                    <div className="flex gap-3">
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
                            disabled={saving || rows.every(r => r.value.trim() === "")}
                            gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
                            hoverGradient="hover:from-blue-600 hover:to-indigo-700"
                            onClick={handleSave}
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
