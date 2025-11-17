"use client";

import { PlusCircle, Edit, Trash2 } from "lucide-react";

export default function SellerProductsPage() {
  const products = [
    {
      _id: "P001",
      name: "Áo thun nam cổ tròn",
      price: 199000,
      stock: 25,
      image: "/images/demo1.jpg",
    },
    {
      _id: "P002",
      name: "Áo hoodie mùa đông",
      price: 320000,
      stock: 10,
      image: "/images/demo2.jpg",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Sản phẩm</h1>
        <button className="flex items-center gap-2 bg-primary text-bg px-4 py-2 rounded-lg hover:bg-primary/80 transition">
          <PlusCircle size={18} /> Thêm sản phẩm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div
            key={p._id}
            className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden"
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4 flex flex-col gap-2">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-text/70">
                Giá: {p.price.toLocaleString()}₫
              </p>
              <p className="text-sm text-text/70">Tồn kho: {p.stock}</p>

              <div className="flex gap-3 mt-2">
                <button className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <Edit size={16} /> Sửa
                </button>
                <button className="text-red-500 hover:text-red-700 flex items-center gap-1">
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
