"use client";

export default function OrdersPage() {
  // Demo dữ liệu đơn hàng
  const orders = [
    { id: "DH001", date: "2025-11-01", total: "500.000₫", status: "Đang giao" },
    {
      id: "DH002",
      date: "2025-10-28",
      total: "1.200.000₫",
      status: "Hoàn tất",
    },
    { id: "DH003", date: "2025-10-20", total: "350.000₫", status: "Hủy" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Đơn hàng của bạn</h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex justify-between items-center p-4 bg-gray-100 rounded-xl shadow hover:shadow-md transition"
          >
            <div>
              <p className="font-medium">Mã đơn: {order.id}</p>
              <p className="text-sm text-text/70">Ngày: {order.date}</p>
            </div>
            <div>
              <div className="p-2 bg-primary-light rounded-full">hiiiii</div>
            </div>
            <div className="text-sm text-text/80">
              <p>Tổng tiền: {order.total}</p>
              <p>Trạng thái: {order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
