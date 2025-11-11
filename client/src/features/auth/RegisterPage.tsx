"use client";
import { RegisterForm } from "./RegisterForm.component"; // Đã thêm .tsx
import styles from "@shared/features/auth/LoginCustom.module.css";
interface RegisterPageProps {
  title?: string;
  redirectPath?: string;
}


export const RegisterPage = ({
  title,
  redirectPath = "/login",
}: RegisterPageProps) => {
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
        <RegisterForm title={title} redirectPath={redirectPath} />
      </div>
    </div>
  );
};