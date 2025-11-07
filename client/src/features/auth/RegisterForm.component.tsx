"use client";
import { useState } from "react";
import { useRegister } from "./useRegister.hook";
import { User, Lock, Phone } from "lucide-react";
import { Button, Input } from "@/components/ui";
import styles from "@/styles/auth.module.css";

export const RegisterForm = () => {
  const [form, setForm] = useState({
    username: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const { handleRegister, loading } = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister(form);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <h2 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản</h2>

      <div className={styles.inputGroup}>
        <User className="icon" />
        <Input
          name="username"
          placeholder="Tên đăng nhập"
          value={form.username}
          onChange={handleChange}
        />
      </div>

      <div className={styles.inputGroup}>
        <Phone className="icon" />
        <Input
          name="phoneNumber"
          placeholder="Số điện thoại"
          value={form.phoneNumber}
          onChange={handleChange}
        />
      </div>

      <div className={styles.inputGroup}>
        <Lock className="icon" />
        <Input
          name="password"
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={handleChange}
        />
      </div>

      <div className={styles.inputGroup}>
        <Lock className="icon" />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu"
          value={form.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-4">
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </Button>
    </form>
  );
};
