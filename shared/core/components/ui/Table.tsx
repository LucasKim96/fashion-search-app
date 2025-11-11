"use client";

import React, { useState, useRef, useEffect } from "react";
import { LucideIcon, Hash } from "lucide-react";
import clsx from "clsx";
import { Pagination } from "./Pagination";

interface Column<T> {
    key: keyof T | string;
    title: string;
    icon?: LucideIcon;
    align?: "left" | "center" | "right";
    width?: number;
    render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    showIndex?: boolean;
    headerColor?: string;
    rowsPerPage?: number;
    showPagination?: boolean;
    paginationBg?: string;
    paginationActiveColor?: string;
    paginationTextColor?: string;
    paginationHoverColor?: string;
}

export function Table<T extends object>({
    columns,
    data,
    showIndex = false,
    headerColor = "bg-blue-100 text-blue-700",
    rowsPerPage = 10,
    showPagination = true,
    paginationBg = "dark:bg-blue-100", //bg-gray-50 dark:bg-gray-800
    paginationActiveColor = "bg-blue-500 text-white border-blue-500", //bg-blue-500 text-white border-blue-500
    paginationTextColor="text-blue-700",
    paginationHoverColor = "hover:bg-blue-50",
}: TableProps<T>) {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // --- Resize ---
    const [colWidths, setColWidths] = useState<{ [key: string]: number }>({});
    const startX = useRef<number | null>(null);
    const resizingKey = useRef<string | null>(null);

    const handleMouseDown = (key: string, e: React.MouseEvent) => {
        startX.current = e.clientX;
        resizingKey.current = key;
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!resizingKey.current || startX.current === null) return;
        const diff = e.clientX - startX.current;
        setColWidths((prev) => ({
        ...prev,
        [resizingKey.current!]: Math.max((prev[resizingKey.current!] || 150) + diff, 60),
        }));
        startX.current = e.clientX;
    };

    const handleMouseUp = () => {
        resizingKey.current = null;
        startX.current = null;
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <div className="w-full border rounded-lg shadow-sm overflow-hidden bg-white">
        <table className="w-full border-collapse">
            {/* --- Header --- */}
            <thead className={clsx(headerColor, "text-sm font-semibold")}>
            <tr>
                {showIndex && (
                <th 
                    className="p-2 border text-center"
                    style={{ width: 70, minWidth: 60, maxWidth: 80 }}
                >
                    <div className="flex justify-center items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>STT</span>
                    </div>
                </th>
                )}

                {columns.map((col) => {
                const Icon = col.icon;
                const colWidth = colWidths[col.key as string] || col.width || "auto";
                return (
                    <th
                    key={String(col.key)}
                    style={{ width: colWidth, minWidth: 100 }}
                    className={clsx(
                        "relative p-2 border select-none",
                        col.align === "left" && "text-left",
                        col.align === "right" && "text-right",
                        !col.align && "text-center"
                    )}
                    >
                    <div
                        className={clsx(
                        "flex items-center gap-1",
                        col.align === "center" && "justify-center",
                        col.align === "right" && "justify-end",
                        col.align === "left" && "justify-start"
                        )}
                    >
                        {Icon && <Icon className="w-4 h-4 shrink-0 text-blue-600" />}
                        <span>{col.title}</span>
                    </div>

                    {/* Resize handle */}
                    <span
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-200 transition"
                        onMouseDown={(e) => handleMouseDown(String(col.key), e)}
                    />
                    </th>
                );
                })}
            </tr>
            </thead>

            {/* --- Body --- */}
            <tbody>
            {paginatedData.length > 0 ? (
                paginatedData.map((row, i) => (
                <tr
                    key={i}
                    className="hover:bg-blue-50 transition-colors border-b last:border-b-0"
                >
                    {showIndex && (
                    <td className="p-2 border text-center text-blue-800 font-medium">
                        {(page - 1) * rowsPerPage + i + 1}
                    </td>
                    )}
                    {columns.map((col) => (
                    <td
                        key={String(col.key)}
                        className={clsx(
                        "p-2 border text-sm text-blue-900",
                        col.align === "left" && "text-left",
                        col.align === "right" && "text-right",
                        !col.align && "text-center"
                        )}
                    >
                        {col.render ? col.render(row, i) : String((row as any)[col.key] ?? "")}
                    </td>
                    ))}
                </tr>
                ))
            ) : (
                <tr>
                <td
                    colSpan={columns.length + (showIndex ? 1 : 0)}
                    className="text-center p-4 text-blue-700 bg-blue-50"
                >
                    Không có dữ liệu để hiển thị
                </td>
                </tr>
            )}
            </tbody>
        </table>

        {/* --- Pagination --- */}
        {showPagination && totalPages > 1 && (
            <div className={clsx("border-t border-blue-100", paginationBg)}>
            <Pagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                backgroundClassName={paginationBg}
                activeColorClassName={paginationActiveColor}
                textColorClassName={paginationTextColor}
                hoverColorClassName={paginationHoverColor}
            />
            </div>
        )}
        </div>
    );
}
