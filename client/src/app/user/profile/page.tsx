"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0123456789",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Đã lưu thông tin (demo)");
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>

      <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary shadow-lg">
            <img
              src="/avatar-placeholder.png"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <button className="mt-2 w-full bg-primary text-bg py-1 rounded-lg hover:bg-primary/80 transition">
            Thay đổi ảnh
          </button>
        </div>

        {/* Form thông tin cá nhân */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Họ tên</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-primary text-bg px-4 py-2 rounded-lg hover:bg-primary/80 transition"
            >
              Lưu thông tin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
