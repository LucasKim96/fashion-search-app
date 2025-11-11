"use client";

import { useState } from "react";

export default function ProfilePage() {
  // Giả lập dữ liệu từ backend
  const userInfo = {
    name: "Hồ Cẩm Trúc",
    dayOfBirth: "2003-07-25",
    avatar:
      "/uploads/avatars/1760870716345_z6368706438184_8842f7c7fcf4c263907db66a0f472065.jpg",
    gender: "male",
    email: "camtruc@gmail.com",
  };

  const user = {
    username: "truc",
    phoneNumber: "0965000902",
    status: "active",
    isBanned: false,
    lastActive: "2025-11-08T18:03:42.054Z",
  };

  // Gộp dữ liệu, bỏ các ID, password, __v, trùng
  const initialForm = {
    username: user.username,
    phone: user.phoneNumber,
    status: user.status,
    isBanned: user.isBanned,
    lastActive: user.lastActive,
    name: userInfo.name,
    email: userInfo.email,
    avatar: userInfo.avatar,
    dayOfBirth: userInfo.dayOfBirth,
    gender: userInfo.gender,
  };

  const [form, setForm] = useState(initialForm);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, gender: e.target.value });
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
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg">
            <img
              src={form.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <button className="mt-2 w-full bg-primary text-bg py-2 rounded-lg hover:bg-primary/80 transition">
            Thay đổi ảnh
          </button>
        </div>

        {/* Form thông tin cá nhân */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* username */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Tên đăng nhập</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Họ tên */}
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

            {/* Email */}
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

            {/* Số điện thoại */}
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

            {/* Giới tính */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Giới tính</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleSelectChange}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none bg-bg text-text"
              >
                {[
                  { value: "male", label: "Nam" },
                  { value: "female", label: "Nữ" },
                  { value: "other", label: "Khác" },
                ].map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày sinh */}
            <div className="flex flex-col">
              <label className="mb-1 font-medium">Ngày sinh</label>
              <input
                type="date"
                name="dayOfBirth"
                value={form.dayOfBirth}
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
