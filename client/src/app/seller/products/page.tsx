"use client";

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { 
  Plus, 
  Grid, 
  Tag, 
  Coins, 
  CreditCard, 
  Banknote, 
  Gem,
  Filter 
} from "lucide-react";

// Giả định đường dẫn import (bạn hãy điều chỉnh lại nếu khác biệt trong dự án thực tế)
import { useProduct, ProductSearchRequest } from "@shared/features/product"; // Hoặc đường dẫn thực tế tới hook
import { SearchHeader, GradientButton, formatCurrency } from "@shared/core"; // Component SearchHeader có sẵn của bạn


// Định nghĩa danh sách bộ lọc giá
const priceFilters = [
  { 
    label: "Tất cả mức giá", 
    value: undefined, // undefined để gửi lên là null/undefined (hoặc handle trong logic)
    color: "from-gray-400 via-gray-350 to-gray-600", 
    icon: <Grid size={16} /> 
  },
  { 
    label: "Dưới 100k", 
    value: "<100", 
    color: "from-blue-400 via-blue-500 to-blue-600", 
    icon: <Coins size={16} /> 
  },
  { 
    label: "100k - 300k", 
    value: "100-300", 
    color: "from-cyan-400 via-cyan-500 to-cyan-600", 
    icon: <Banknote size={16} /> 
  },
  { 
    label: "300k - 500k", 
    value: "300-500", 
    color: "from-teal-400 via-teal-500 to-teal-600", 
    icon: <CreditCard size={16} /> 
  },
  { 
    label: "500k - 1 triệu", 
    value: "500-1000", 
    color: "from-indigo-400 via-indigo-500 to-indigo-600", 
    icon: <Tag size={16} /> 
  },
  { 
    label: "Trên 1 triệu", 
    value: "1000<", 
    color: "from-purple-400 via-purple-500 to-purple-600", 
    icon: <Gem size={16} /> 
  },
];

export default function SellerProductPage() {
  // --- Hooks ---
  const { searchShopProducts, shopProductsState } = useProduct();
  
  // --- Local State ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<ProductSearchRequest["priceRange"] | undefined>(undefined);
  const [isCreateClicked, setIsCreateClicked] = useState<boolean>(false);
  
  // Biến dùng để trigger reload (truyền xuống children hoặc dùng trong effect)
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // --- Handlers ---
  
  // Hàm reload data, sẽ được truyền xuống component con sau này nếu cần
  const triggerReload = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Gọi API search mỗi khi query, filter giá hoặc refreshKey thay đổi
  useEffect(() => {
    const fetchData = async () => {
      await searchShopProducts({
        query: searchQuery,
        priceRange: selectedPriceRange,
        status: "all", // Mặc định lấy tất cả trạng thái, hoặc tuỳ chỉnh
        page: 1, // Reset về trang 1 khi filter thay đổi (xử lý pagination sau)
        limit: 20
      });
    };

    // Debounce search text nếu cần thiết (ở đây gọi trực tiếp theo logic đơn giản)
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // Debounce nhẹ 300ms tránh gọi API liên tục khi gõ

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPriceRange, refreshKey, searchShopProducts]);

  return (
    <div className="p-6 space-y-4 h-screen flex flex-col bg-gray-50/50">
      
      {/* 1. Header với Search */}
      <SearchHeader
        title="QUẢN LÝ SẢN PHẨM"
        searchPlaceholder="Tìm kiếm theo tên sản phẩm..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Bộ lọc theo giá (Price Filter) */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        {/* Phần Filter (Bên trái) */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter size={18} />
            <span className="text-sm font-semibold">Lọc theo khoảng giá:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-2xl shadow-inner border border-gray-200">
            {priceFilters.map((item) => (
              <button
                key={item.label}
                onClick={() => setSelectedPriceRange(item.value as ProductSearchRequest["priceRange"])}
                className={clsx(
                  "relative flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm",
                  selectedPriceRange === item.value
                    ? `bg-gradient-to-r ${item.color} text-white shadow-md scale-105`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phần Nút tạo (Bên phải) - Không co giãn */}
        <div className="flex-shrink-0 pb-1"> {/* pb-1 để căn chỉnh nhẹ với shadow của filter box */}
          <GradientButton
            label="Thêm sản phẩm mới"
            icon={Plus}
            gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
            hoverGradient="hover:from-green-600 hover:to-emerald-700"
            onClick={() => setIsCreateClicked(true)}
            className="shadow-lg shadow-green-500/30 h-[46px]" // Set chiều cao cố định để đẹp đội hình với filter
          />
        </div>
        
      </div>


      {/* 4. Content Placeholder */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative min-h-0">
        {shopProductsState.loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Đang tải dữ liệu...
            </div>
        ) : (
           /* Sau này sẽ nhét component danh sách sản phẩm vào đây */
           /* Truyền triggerReload xuống component con để khi xóa/sửa xong thì gọi triggerReload() */
          <div className="p-6 h-full overflow-y-auto">
              {/* Placeholder cho danh sách sản phẩm */}
              {shopProductsState.data && shopProductsState.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Render tạm để test logic */}
                  {shopProductsState.data.map((prod) => (
                    <div key={prod._id} className="p-4 border rounded-lg hover:shadow-md transition">
                      <h3 className="font-bold text-gray-800">{prod.pdName}</h3>
                      <p className="text-emerald-600 font-medium">
                        {formatCurrency(prod.basePrice)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>Không tìm thấy sản phẩm nào.</p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Modal hoặc logic tạo sản phẩm sẽ xử lý dựa trên state isCreateClicked */}
      {/* <CreateProductModal open={isCreateClicked} onClose={() => setIsCreateClicked(false)} onSuccess={triggerReload} /> */}
    </div>
  );
}