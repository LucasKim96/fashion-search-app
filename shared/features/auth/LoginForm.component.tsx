"use client";
import { useState } from "react";
import { Lock, User } from "lucide-react";
import { Button, Input } from "@shared/core/components/ui";

import { useLogin } from "./useLogin.hook";

interface LoginFormProps {
  redirectPath?: string; // linh hoạt: "/admin/dashboard" hoặc "/dashboard"
  title?: string;
}

export const LoginForm = ({ redirectPath = "/dashboard", title }: LoginFormProps) => {
  const [usernameOrPhone, setUsernameOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const { handleLogin, loading } = useLogin(redirectPath);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(usernameOrPhone, password);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-8 w-full max-w-md border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-6">{title || "Đăng nhập"}</h2>

      <div className="flex items-center border border-gray-300 rounded-md p-2 mb-4">
        <User className="w-5 h-5 text-red-500 mr-2" />
        <Input
          type="text"
          placeholder="Tên đăng nhập hoặc số điện thoại"
          value={usernameOrPhone}
          onChange={(e) => setUsernameOrPhone(e.target.value)}
        />
      </div>

      <div className="flex items-center border border-gray-300 rounded-md p-2 mb-4">
        <Lock className="w-5 h-5 text-red-500 mr-2" />
        <Input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-4">
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
};
