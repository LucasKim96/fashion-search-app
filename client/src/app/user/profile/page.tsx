"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@shared/features/auth/useAuth.hook";
import { UserInfo } from "@shared/features/user/user.types";
import { buildImageUrl } from "@shared/core/utils/image.utils";

export default function ProfilePage() {
  const { user: account, loading } = useAuth(); // user từ backend
  const [form, setForm] = useState({
    username: "",
    phone: "",
    status: "",
    isBanned: false,
    lastActive: "",
    name: "",
    email: "",
    avatarUrl: "",
    dayOfBirth: "",
    gender: "other",
  });

  useEffect(() => {
    if (account) {
      const userInfo = account.userInfoId as UserInfo | undefined;
      const avatarPath = userInfo?.avatar || "/assets/avatars/default-avatar.jpg";
      setForm({
        username: account.username || "",
        phone: account.phoneNumber || "",
        status: account.status || "",
        isBanned: account.isBanned || false,
        lastActive: account.lastActive || "",
        name: userInfo?.name || "",
        email: userInfo?.email || "",
        avatarUrl: buildImageUrl(avatarPath), // tạo URL đầy đủ
        dayOfBirth: userInfo?.dayOfBirth || "",
        gender: userInfo?.gender || "other",
      });
    }
  }, [account]);

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

  if (loading) return <p className="p-4 text-gray-500">Đang tải...</p>;
  if (!account) return <p className="p-4 text-red-500">Không lấy được user</p>;

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>

      <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg">
            {form.avatarUrl ? (
  <img
    src={form.avatarUrl}
    alt={form.name || "avatar"}
    className="w-full h-full object-cover"
  />
) : (
  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold text-3xl">
    {form.name?.charAt(0)?.toUpperCase() || "?"}
  </div>
)}

          </div>
          <button className="mt-2 w-full bg-primary text-bg py-2 rounded-lg hover:bg-primary/80 transition">
            Thay đổi ảnh
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col items-center w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {[
              { label: "Tên đăng nhập", name: "username", type: "text" },
              { label: "Họ tên", name: "name", type: "text" },
              { label: "Email", name: "email", type: "email" },
              { label: "Số điện thoại", name: "phone", type: "text" },
              { label: "Ngày sinh", name: "dayOfBirth", type: "date" },
            ].map((field) => (
              <div key={field.name} className="flex flex-col">
                <label className="mb-1 font-medium">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={(form as any)[field.name]}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            ))}

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
