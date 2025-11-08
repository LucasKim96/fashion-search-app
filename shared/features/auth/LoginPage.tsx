"use client";
import { LoginForm } from "./LoginForm.component"; // Đã thêm .tsx
import  styles  from "./LoginCustom.module.css";
interface LoginPageProps {
  title?: string;
  redirectPath?: string;
  showRegisterLink?: boolean;
}

export const LoginPage = ({
  title,
  redirectPath = "/dashboard",
  showRegisterLink = false,
}: LoginPageProps) => {
  return (
    // Sử dụng .auth-wrapper để áp dụng full screen, background và center
    <div className={styles["auth-wrapper"]}> 

      {/* Hero Title: Sẽ sử dụng CSS của .hero-title */}
      <div className={styles["hero-title"]}>
        <h1>Fashion</h1>
        <h3>Fashion search</h3>
      </div>

      {/* Auth Form: Sẽ sử dụng CSS của .auth-form */}
      <div className={styles["auth-form"]}>
        <LoginForm 
          title={title} 
          redirectPath={redirectPath} 
          showRegisterLink={showRegisterLink} // truyền prop xuống
        />
      </div>
    </div>
  );
};