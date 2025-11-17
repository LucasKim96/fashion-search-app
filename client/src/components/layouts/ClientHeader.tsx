"use client";

import { ShoppingCart, Search, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@shared/features/auth/useAuth.hook";
import { parseUserProfile, UserProfile } from "@shared/core/utils/profile.utils";

export default function ClientHeader() {
  const { user: account, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();
  const [cartCount] = useState(0);

  useEffect(() => {
    if (account) setUserProfile(parseUserProfile(account));
  }, [account]);

  if (loading) return <p className="p-4 text-gray-500">Đang tải...</p>;
  if (!userProfile) return <p className="p-4 text-red-500">Không lấy được thông tin user</p>;

  return (
    <header className="w-full bg-bg text-text shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Logo + Mobile Menu */}
      <div className="flex items-center gap-4">
        <Menu className="w-6 h-6 md:hidden cursor-pointer text-text/80 hover:text-primary transition" />
        <div
          className="font-extrabold text-2xl text-primary cursor-pointer"
          onClick={() => router.push("/")}
        >
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
        {/* Cart */}
        <div
          className="relative cursor-pointer"
          onClick={() => router.push("/cart")}
        >
          <ShoppingCart className="w-6 h-6 hover:text-primary transition" />
          {cartCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-primary text-bg text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-10">
              {cartCount}
            </span>
          )}
        </div>

        {/* User Avatar */}
        <div
          className="relative w-12 h-12 group cursor-pointer"
          onClick={() => router.push("/user/profile")}
        >
          <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 animate-spin-slow border-2 border-transparent">
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #3b82f6, #ec4899, #a78bfa, #3b82f6)",
              }}
            />
          </div>
          <div className="relative w-full h-full rounded-full overflow-hidden border border-gray-300 transition-transform duration-300 group-hover:scale-105 z-10">
            <img
              src={userProfile.avatarUrl || "/assets/avatars/default-avatar.jpg"}
              alt={userProfile.name || "avatar"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
