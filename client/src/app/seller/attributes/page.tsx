"use client";

import React, { useState, useEffect } from "react";
import { AttributeSidebarLayout } from "@/features/attributes";
import { SearchHeader, GradientButton } from "@shared/core";
import { useAttribute } from "@shared/features/attribute/attribute.hook";
import { Plus } from "lucide-react";

export default function AttributePage() {
    const { getShopAttributes, searchShopAttributes } = useAttribute();
    const [search, setSearch] = useState("");
    const [createClicked, setCreateClicked] = useState(false);

    // Fetch danh sách attributes khi mount
    useEffect(() => {
        getShopAttributes();
    }, [getShopAttributes]);

    // Tìm kiếm khi search thay đổi
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
        searchShopAttributes({ query: search });
        }, 300); // debounce 300ms

        return () => clearTimeout(delayDebounce);
    }, [search, searchShopAttributes]);

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

