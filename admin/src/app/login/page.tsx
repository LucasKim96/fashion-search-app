import { LoginPage } from "@shared/features/auth/LoginPage";

export default function AdminLogin() {
  return (
    <LoginPage 
      title="Đăng nhập quản trị" 
      redirectPath="/admin/dashboard"
      showRegisterLink={false} // tắt link đăng ký cho admin
    />
  );
}
