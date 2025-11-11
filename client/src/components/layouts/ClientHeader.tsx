"use client";

import { ShoppingCart, User, Search, Menu } from "lucide-react";
import { useState } from "react";

export default function ClientHeader() {
  const [cartCount] = useState(3); // ví dụ số lượng trong giỏ

  return (
    <header className="w-full bg-bg text-text shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Logo + Mobile Menu */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu icon */}
        <Menu className="w-6 h-6 md:hidden cursor-pointer text-text/80 hover:text-primary transition" />
        <div className="font-extrabold text-2xl text-primary">
          FashionSearch
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-lg hidden md:block">
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          className="w-full border border-border rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-primary-light focus:outline-none bg-bg text-text shadow-sm transition"
        />
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text/50"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        {/* Cart with badge */}
        <div className="relative cursor-pointer">
          <ShoppingCart className="w-6 h-6 hover:text-primary transition" />
          {cartCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-primary text-bg text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-10">
              {cartCount}
            </span>
          )}
        </div>

        {/* User */}
        <User className="w-6 h-6 cursor-pointer hover:text-primary transition" />
      </div>
    </header>
  );
}
