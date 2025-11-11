"use client";

import React from "react";
import clsx from "clsx";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
} from "lucide-react";

interface PaginationProps {
    page: number;
    totalPages: number;
    setPage: (page: number) => void;
    backgroundClassName?: string;      // Nền của thanh pagination
    activeColorClassName?: string;     // Màu nút active
    textColorClassName?: string;       // Màu chữ mặc định (không active)
    hoverColorClassName?: string;      // Màu hover cho nút bình thường
}

export const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    setPage,
    backgroundClassName = "dark:bg-blue-100",
    activeColorClassName = "bg-blue-500 text-white border-blue-500",
    textColorClassName = "text-blue-700 hover:bg-blue-100", // Màu chữ mặc định
    hoverColorClassName = "hover:bg-blue-100",
}) => {
    const getPagesToShow = () => {
        const pages: (number | "dots")[] = [];
        if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
        const start = Math.max(2, page - 2);
        const end = Math.min(totalPages - 1, page + 2);

        pages.push(1);
        if (start > 2) pages.push("dots");
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 1) pages.push("dots");
        pages.push(totalPages);
        }
        return pages;
    };

    const pagesToShow = getPagesToShow();

    return (
        totalPages > 1 && (
        <div
            className={clsx(
            "flex justify-center items-center gap-1 p-3 border-t transition-colors",
            backgroundClassName
            )}
        >
            {/* Trang đầu */}
            <button
            className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-md border transition",
                textColorClassName,
                hoverColorClassName,
                page === 1 && "opacity-50 cursor-not-allowed"
            )}
            disabled={page === 1}
            onClick={() => setPage(1)}
            >
            <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Trang trước */}
            <button
            className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-md border transition",
                textColorClassName,
                hoverColorClassName,
                page === 1 && "opacity-50 cursor-not-allowed"
            )}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            >
            <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Nút số trang */}
            {pagesToShow.map((p, i) =>
                p === "dots" ? (
                    <MoreHorizontal key={`dots-${i}`} className="w-4 h-4 text-gray-400" />
                ) : (
                    <button
                        key={`page-${p}-${i}`}  // duy nhất
                        onClick={() => setPage(p)}
                        className={clsx(
                            "w-8 h-8 rounded-md border text-sm font-medium transition",
                            p === page ? activeColorClassName : clsx(textColorClassName, hoverColorClassName)
                        )}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Trang tiếp */}
            <button
            className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-md border transition",
                textColorClassName,
                hoverColorClassName,
                page === totalPages && "opacity-50 cursor-not-allowed"
            )}
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            >
            <ChevronRight className="w-4 h-4" />
            </button>

            {/* Trang cuối */}
            <button
            className={clsx(
                "flex items-center justify-center w-8 h-8 rounded-md border transition",
                textColorClassName,
                hoverColorClassName,
                page === totalPages && "opacity-50 cursor-not-allowed"
            )}
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            >
            <ChevronsRight className="w-4 h-4" />
            </button>
        </div>
        )
    );
};
