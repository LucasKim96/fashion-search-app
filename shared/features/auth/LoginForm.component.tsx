"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Eye, EyeOff } from "lucide-react";
import styles from "./LoginCustom.module.css";
import { useAuth } from "./useAuth.hook";

interface LoginFormProps {
	redirectPath?: string; // "/admin/dashboard" hoặc "/dashboard"
	title?: string;
	showRegisterLink?: boolean;
}

export const LoginForm = ({
	redirectPath = "/dashboard",
	title,
	showRegisterLink = false,
}: LoginFormProps) => {
	const router = useRouter();

	const [usernameOrPhone, setUsernameOrPhone] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const { login, loading } = useAuth({ redirectAfterLogin: redirectPath });

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		login(usernameOrPhone, password);
	};

	return (
		<form onSubmit={handleSubmit}>
			<h2 className={styles["auth-form-title"]}>{title || "Đăng nhập"}</h2>

			{/* Username */}
			<div className={styles["input-field"]}>
				<input
					type="text"
					placeholder="Tên đăng nhập hoặc số điện thoại"
					value={usernameOrPhone}
					onChange={(e) => setUsernameOrPhone(e.target.value)}
				/>
				<User size={20} />
			</div>

			{/* Password */}
			<div className={styles["password-field"]}>
				<input
					type={showPassword ? "text" : "password"}
					placeholder="Mật khẩu"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				{showPassword ? (
					<EyeOff size={20} onClick={() => setShowPassword(false)} />
				) : (
					<Eye size={20} onClick={() => setShowPassword(true)} />
				)}
			</div>

			{/* Submit */}
			<button
				type="submit"
				className={styles["auth-button"]}
				disabled={loading}>
				{loading ? "Đang đăng nhập..." : "Đăng nhập"}
			</button>

			{/* Link to register (chỉ hiển thị khi showRegisterLink = true) */}
			{showRegisterLink && (
				<div className={styles["switch-auth-mode"]}>
					<p onClick={() => router.push("/register")}>
						Chưa có tài khoản? <span>Đăng ký ngay</span>
					</p>
					<p onClick={() => router.push("/")}>Quay lại trang chủ</p>
				</div>
			)}
		</form>
	);
};
