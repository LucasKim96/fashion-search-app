"use client";

import { useParams } from "next/navigation";
import { PackageCheck, Truck, XCircle } from "lucide-react";

export default function SellerOrderDetailPage() {
  const { id } = useParams();

  // ⚙️ Dữ liệu demo — sau này thay bằng API fetch(`/api/orders/${id}`)
  const order = {
    _id: id,
    customer: { name: "Nguyễn Văn A", phone: "0901234567" },
    address: "123 Lý Thường Kiệt, Quận 10, TP.HCM",
    createdAt: "2025-11-07T10:30:00Z",
    status: "shipping",
    totalAmount: 1250000,
    items: [
      {
        name: "Áo thun cotton",
        image:
          "https://down-vn.img.susercontent.com/file/sg-11134201-23030-ky9b2cp7d9nv51",
        price: 250000,
        quantity: 2,
      },
      {
        name: "Quần jean xanh",
        image:
          "https://down-vn.img.susercontent.com/file/sg-11134201-23030-ky9b2cp7d9nv51",
        price: 750000,
        quantity: 1,
      },
    ],
  };

  const statusColor =
    order.status === "delivered"
      ? "text-green-600"
      : order.status === "shipping"
      ? "text-blue-600"
      : "text-red-500";

  const statusIcon =
    order.status === "delivered"
      ? PackageCheck
      : order.status === "shipping"
      ? Truck
      : XCircle;

  const Icon = statusIcon;

  return (
    <div className="flex flex-col gap-6 bg-white p-6 rounded-xl shadow">
      <h1 className="text-xl font-semibold text-primary">
        Chi tiết đơn hàng #{order._id}
      </h1>

      {/* Thông tin khách hàng */}
      <div className="border-b pb-3">
        <h2 className="font-medium mb-2 text-text/80">Thông tin khách hàng</h2>
        <p>Tên: {order.customer.name}</p>
        <p>SĐT: {order.customer.phone}</p>
        <p>Địa chỉ: {order.address}</p>
      </div>

      {/* Trạng thái đơn */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className={statusColor} size={20} />
        <span className={statusColor}>
          {order.status === "delivered"
            ? "Đã giao hàng"
            : order.status === "shipping"
            ? "Đang giao"
            : "Đã hủy"}
        </span>
      </div>

      {/* Danh sách sản phẩm */}
      <div>
        <h2 className="font-medium text-text/80 mb-3">Sản phẩm trong đơn</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded object-cover"
                />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-text/60">
                    Số lượng: {item.quantity}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-text">
                {(item.price * item.quantity).toLocaleString()}₫
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="flex justify-end border-t pt-4">
        <p className="text-lg font-semibold text-primary">
          Tổng cộng: {order.totalAmount.toLocaleString()}₫
        </p>
      </div>
    </div>
  );
}
