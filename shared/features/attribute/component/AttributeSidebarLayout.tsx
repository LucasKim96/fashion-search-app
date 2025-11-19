
// shared/features/attribute/AttributeSidebarLayout.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { SidebarLayout, Input, GradientButton, formatVNDate} from "@shared/core";
import { useAttribute, Attribute } from "@shared/features/attribute";
import { CardAttributeValue } from "./CardAttributeValue";
import { Calendar, Activity, Eye, Edit2, Trash2, Plus, Zap, Shapes, Tags} from "lucide-react";
import { AttributeHeader } from "./AttributeHeader";
import { CreateAttributePanel, CreateAttributeValue} from "./index";
import {AttributeValue } from "../attributeValue.types"

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
    const [valuePanelOpen, setValuePanelOpen] = useState(false);

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
    // const sidebarItems = useMemo(
    //     () => attributes.map(attr => ({ id: attr._id, label: attr.label })),
    //     [attributes]
    // );
    const sidebarItems = useMemo(() => {
        if (createClicked) {
            // Chỉ hiển thị nút tạo
            return [{ id: "create", label: "Tạo thuộc tính" }];
        }
        return attributes.map(attr => ({ id: attr._id, label: attr.label }));
    }, [attributes, createClicked]);

    // ================= Chọn item mặc định =================
    // Chọn item mặc định
    // 1. Khi createClicked thay đổi
    useEffect(() => {
        if (createClicked) {
            setSelectedId("create"); // chọn mục tạo
        }
    }, [createClicked]);

    // 2. Khi attributes thay đổi (và không đang tạo)
    useEffect(() => {
        if (createClicked) return; // đang tạo => bỏ qua

        const ids = attributes.map(a => a._id);
        if (!ids.length) {
            setSelectedId(null);
        } else if (!ids.includes(selectedId!)) {
            setSelectedId(ids[0]);
        }
    }, [attributes, createClicked, selectedId]);


    const selectedAttribute = useMemo(
        () => attributes.find(a => a._id === selectedId) || null,
        [attributes, selectedId]
    );

    //================Tạo thuộc tính==============
    useEffect(() => {
        if (createClicked) {
            setSelectedId(null); // bỏ chọn item
        }
    }, [createClicked]);

    //========Test select value-==================
    // Lưu cả object của value
    const [selectedValues, setSelectedValues] = useState<AttributeValue[]>([]);

    const toggleSelectedValue = (value: AttributeValue, isSelected: boolean) => {
        console.log("▶ CLICK VALUE:", value);  
        console.log("▶ isSelected:", isSelected);

        setSelectedValues(prev => {
            const next = isSelected
                ? [...prev, value]
                : prev.filter(v => v._id !== value._id);

            console.log("▶ selectedValues sau khi cập nhật:", next);
            return next;
        });
    };

    // Lưu ID đã chọn cho mỗi attribute
    const [selectedValueByAttribute, setSelectedValueByAttribute] = useState<Record<string, AttributeValue | null>>({});
    const toggleSingleSelect = (attributeId: string, value: AttributeValue) => {
        setSelectedValueByAttribute(prev => {
            const newSelected = {
                ...prev,
                [attributeId]: prev[attributeId]?._id === value._id ? null : value
            };

            console.log(`Attribute ${attributeId} selected value:`, newSelected[attributeId]);
            return newSelected;
        });
    };
    // ================= Debug state =================
    const renderContent = () => {
        if (loadingAdmin)
            return (
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
                </div>
            );

        if (createClicked) {
            return (
                <CreateAttributePanel
                    onCancel={() => setCreateClicked?.(false)}
                    onSave={async () => {
                        await reloadAdminAttributes();
                        setCreateClicked?.(false);
                    }}
                />
            );
        }

        if (!selectedAttribute) return <p>Chọn một thuộc tính để xem chi tiết</p>;
        
        return (
        <div className="space-y-6">
            {/* Header */}
            <AttributeHeader  attribute={selectedAttribute} onUpdated={reloadAdminAttributes} disableActions={valuePanelOpen}/>

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

            {/* <div>
                <p className="font-semibold flex items-center gap-1 text-indigo-600">
                Global
                </p>
                <p className="font-medium text-gray-800">{selectedAttribute.isGlobal ? "Yes" : "No"}</p>
            </div> */}
            </div>

            <hr />
            {/* Buttons Add / Edit */}
            {!valuePanelOpen && (
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
                        onClick={() => setValuePanelOpen(true)}
                    />
                    <GradientButton
                        label={editMode ? "Thoát chỉnh sửa" : "Sửa giá trị"}
                        icon={Edit2}
                        gradient="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"
                        hoverGradient="hover:from-blue-600 hover:to-indigo-700"
                        onClick={() => setEditMode(prev => !prev)}
                    />
                </div>
            )}
            
            
            {/* Grid Values hoặc CreateAttributeValue */}
            {valuePanelOpen ? (
                <CreateAttributeValue
                    attribute={selectedAttribute}
                    onCancel={() => setValuePanelOpen(false)}
                    onSave={async () => {
                        await reloadAdminAttributes();
                        setValuePanelOpen(false);
                    }}
                />
            ) : (
                selectedAttribute.values?.length ? (
                    <div
                        className={`grid ${editMode
                            ? "grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
                            : "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"} justify-center`}
                    >
                        {selectedAttribute.values.map(value => (
                            <CardAttributeValue
                                key={value._id}
                                attribute={selectedAttribute}
                                value={value}
                                
                                // selectable={!editMode}
                                // selected={selectedValues.some(v => v._id === value._id)}
                                // onSelectChange={(isSelected) =>
                                //     toggleSelectedValue(value, isSelected)
                                // }

                                // selected={selectedValueByAttribute[selectedAttribute._id]?._id === value._id}
                                // singleSelect={true}
                                // onSelectChange={(isSelected) =>
                                //     toggleSingleSelect(selectedAttribute._id, value)
                                // }
                                
                                mini={!editMode}
                                showActions={editMode}
                                showStatus={editMode}
                                onEdit={async () => await reloadAdminAttributes()}
                                onHide={async () => await reloadAdminAttributes()}
                                onDelete={async () => await reloadAdminAttributes()}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Chưa có giá trị nào</p>
                )
            )}


            {/* Grid Values */}
            {/* {selectedAttribute.values?.length ? (
            <div
                className={`grid ${
                editMode
                    ? "grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
                    : "grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2"
                } justify-center`}
            >
                {selectedAttribute.values.map(value => (
                <CardAttributeValue
                    key={value._id}
                    attribute={selectedAttribute}
                    value={value}
                    mini={!editMode}
                    compact={false}
                    showActions={editMode}
                    showStatus={editMode}
                    onEdit={async () => await reloadAdminAttributes()}
                    onHide={async () => await reloadAdminAttributes()}
                    onDelete={async () => await reloadAdminAttributes()}
                />
                ))}
            </div>
            ) : (
            <p className="text-gray-400">Chưa có giá trị nào</p>
            )} */}
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
