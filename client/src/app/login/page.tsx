import { LoginPage } from "@shared/features/auth/LoginPage";

export default function AdminLogin() {
  return (
    <LoginPage title="ĐĂNG NHẬP" redirectPath="/admin/dashboard" />
  );
}
