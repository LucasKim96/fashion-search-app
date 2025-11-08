"use client";
import { useState } from "react";
import { User, Phone, Lock, Eye, EyeOff } from "lucide-react";
import styles from "@shared/features/auth/LoginCustom.module.css";
import { useAuth } from "@shared/features/auth";

interface RegisterFormProps {
  redirectPath?: string; // sau khi đăng ký xong chuyển hướng
  title?: string;
}

export const RegisterForm = ({
  redirectPath = "/login",
  title = "Đăng ký tài khoản",
}: RegisterFormProps) => {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, loading } = useAuth({
    redirectAfterRegister: redirectPath,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ username, phoneNumber, password, confirmPassword });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className={styles["auth-form-title"]}>{title}</h2>

      {/* Username */}
      <div className={styles["input-field"]}>
        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <User size={20} />
      </div>

      {/* Phone */}
      <div className={styles["input-field"]}>
        <input
          type="text"
          placeholder="Số điện thoại"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <Phone size={20} />
      </div>

      {/* Password */}
      <div className={styles["password-field"]}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {showPassword ? (
          <EyeOff size={20} onClick={() => setShowPassword(false)} />
        ) : (
          <Eye size={20} onClick={() => setShowPassword(true)} />
        )}
      </div>

      {/* Confirm Password */}
      <div className={styles["password-field"]}>
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {showConfirmPassword ? (
          <EyeOff size={20} onClick={() => setShowConfirmPassword(false)} />
        ) : (
          <Eye size={20} onClick={() => setShowConfirmPassword(true)} />
        )}
      </div>

      <button
        type="submit"
        className={styles["auth-button"]}
        disabled={loading}
      >
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>
    </form>
  );
};
