"use client";

import { ShoppingCart, User, Search } from "lucide-react";

export default function ClientHeader() {
  return (
    <header className="w-full bg-white shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="font-bold text-xl text-blue-600">FashionSearch</div>

      <div className="flex items-center gap-3">
        <div className="relative w-64 hidden md:block">
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            className="w-full border rounded-lg py-2 px-3 pl-9 focus:ring-2 focus:ring-blue-400"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <ShoppingCart className="cursor-pointer hover:text-blue-600" />
        <User className="cursor-pointer hover:text-blue-600" />
      </div>
    </header>
  );
}
