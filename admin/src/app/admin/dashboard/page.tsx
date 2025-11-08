"use client";

import React from "react";
import { useAuth } from "@shared/features/auth/useAuth.hook";
import { Card, CardContent } from "@/components/ui/Card";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Bảng điều khiển</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-white shadow rounded-2xl p-4">
          <CardContent>
            <p className="text-gray-500">Xin chào,</p>
            <h2 className="text-lg font-semibold text-gray-800 mt-1">
              {user?.username || "Quản trị viên"}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-white shadow rounded-2xl p-4">
          <CardContent>
            <p className="text-gray-500">Số lượng người dùng</p>
            <h2 className="text-2xl font-bold text-gray-800">1,248</h2>
          </CardContent>
        </Card>

        <Card className="bg-white shadow rounded-2xl p-4">
          <CardContent>
            <p className="text-gray-500">Đơn hàng hôm nay</p>
            <h2 className="text-2xl font-bold text-gray-800">152</h2>
          </CardContent>
        </Card>

        <Card className="bg-white shadow rounded-2xl p-4">
          <CardContent>
            <p className="text-gray-500">Doanh thu hôm nay</p>
            <h2 className="text-2xl font-bold text-green-600">₫12,450,000</h2>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
