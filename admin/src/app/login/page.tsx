import { LoginPage } from "@shared/features/auth/LoginPage";

export default function AdminLogin() {
  return <LoginPage title="Đăng nhập Quản trị" redirectPath="/admin/dashboard" />;
}