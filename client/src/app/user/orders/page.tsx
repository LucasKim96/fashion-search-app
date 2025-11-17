"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();

  // Demo dữ liệu tóm tắt đơn hàng
  const orders = [
    {
      _id: "DH001",
      createdAt: "2025-11-06T14:26:10.827Z",
      totalAmount: 250000,
      status: "delivered",
      shopName: "Shop ABC",
      orderItems: [
        {
          pdNameAtOrder: "Áo hoodie mùa đông",
          quantity: 1,
          productImage: "/images/hoodie1.jpg",
        },
      ],
    },
    {
      _id: "DH002",
      createdAt: "2025-11-05T10:12:00.000Z",
      totalAmount: 1200000,
      status: "shipping",
      shopName: "Shop XYZ",
      orderItems: [
        {
          pdNameAtOrder: "Áo hoodie mùa đông",
          quantity: 1,
          productImage: "/images/hoodie1.jpg",
        },
      ],
    },
    {
      _id: "DH003",
      createdAt: "2025-11-04T09:00:00.000Z",
      totalAmount: 350000,
      status: "cancelled",
      shopName: "Shop LMN",
      orderItems: [
        {
          pdNameAtOrder: "Áo hoodie mùa đông",
          quantity: 1,
          productImage: "/images/hoodie1.jpg",
        },
      ],
    },
  ];

  const [filter, setFilter] = useState<
    "all" | "delivered" | "shipping" | "cancelled"
  >("all");

  // Lọc đơn hàng theo filter
  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Đơn hàng của bạn</h1>

      {/* Filter trạng thái */}
      <div className="flex gap-2">
        {["all", "shipping", "delivered", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-3 py-1 rounded-lg font-medium text-sm transition ${
              filter === status
                ? "bg-primary text-bg"
                : "bg-gray-200 text-text hover:bg-gray-300"
            }`}
          >
            {status === "all"
              ? "Tất cả"
              : status === "shipping"
              ? "Đang giao"
              : status === "delivered"
              ? "Hoàn tất"
              : "Hủy"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 items-center">
        {filteredOrders.map((order) => {
          const firstItem = order.orderItems?.[0]; // Lấy sản phẩm đầu tiên
          const firstProductImage = firstItem?.productImage;
          const firstProductName = firstItem?.pdNameAtOrder;
          const firstProductQty = firstItem?.quantity;

          return (
            <div
              key={order._id}
              onClick={() => router.push(`/user/orders/${order._id}`)}
              className="flex justify-between items-center p-4 bg-gray-100 rounded-xl shadow hover:shadow-md transition cursor-pointer w-4/5"
            >
              {/* Thông tin đơn hàng */}
              <div>
                <p className="font-medium">Mã đơn: {order._id}</p>
                <p className="text-sm text-text/70">
                  Ngày: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-text/70">Shop: {order.shopName}</p>
              </div>

              {/* Ảnh và tên sản phẩm đầu tiên */}
              <div className="flex flex-col items-center gap-2 w-20">
                {firstProductImage ? (
                  <img
                    src={firstProductImage}
                    alt={firstProductName}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
                {firstProductName && (
                  <p className="text-xs text-center text-text/70 truncate w-full">
                    {firstProductName} x{firstProductQty}
                  </p>
                )}
              </div>

              {/* Tổng tiền & trạng thái */}
              <div className="text-sm text-text/80">
                <p>Tổng tiền: {order.totalAmount.toLocaleString()}₫</p>
                <p>Trạng thái: {order.status}</p>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <p className="text-text/60 text-center py-4 w-72">
            Không có đơn hàng nào.
          </p>
        )}
      </div>
    </div>
  );
}
