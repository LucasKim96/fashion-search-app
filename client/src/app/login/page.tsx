import { LoginPage } from "@shared/features/auth/LoginPage";

export default function ClientLogin() {
  return <LoginPage title="Đăng nhập" redirectPath="/dashboard" />;
}