"use client";

import { useRouter } from "next/navigation";

export default function SellerOrdersPage() {
  const router = useRouter();

  const orders = [
    {
      _id: "ORD001",
      buyer: "Nguyễn Văn A",
      total: 350000,
      status: "shipping",
      createdAt: "2025-11-06T10:12:00Z",
    },
    {
      _id: "ORD002",
      buyer: "Trần Thị B",
      total: 890000,
      status: "delivered",
      createdAt: "2025-11-05T12:45:00Z",
    },
  ];

  const statusMap: Record<string, string> = {
    pending: "Chờ xử lý",
    shipping: "Đang giao",
    delivered: "Hoàn tất",
    cancelled: "Đã hủy",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Quản lý đơn hàng</h1>

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <div
            key={order._id}
            onClick={() => router.push(`/seller/orders/${order._id}`)}
            className="flex justify-between items-center bg-white p-4 rounded-xl shadow hover:shadow-md transition cursor-pointer"
          >
            <div>
              <p className="font-medium">Mã đơn: {order._id}</p>
              <p className="text-sm text-text/70">
                Ngày: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-text/70">Người mua: {order.buyer}</p>
            </div>

            <div className="text-sm text-text/80 text-right">
              <p>Tổng tiền: {order.total.toLocaleString()}₫</p>
              <p>Trạng thái: {statusMap[order.status] || order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
