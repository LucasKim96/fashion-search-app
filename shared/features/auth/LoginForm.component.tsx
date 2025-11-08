"use client";
import { useState } from "react";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@shared/core/components/ui";
import  styles  from "./LoginCustom.module.css";
import { useAuth } from "./useAuth.hook"; 

interface LoginFormProps {
  redirectPath?: string; // "/admin/dashboard" hoặc "/dashboard"
  title?: string;
}

export const LoginForm = ({ redirectPath = "/dashboard", title }: LoginFormProps) => {
  const [usernameOrPhone, setUsernameOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth({ redirectAfterLogin: redirectPath }); // ✅ dùng login từ hook mới

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(usernameOrPhone, password);
  };

  return (
    <form onSubmit={handleSubmit} >
      <h2 className={styles["auth-form-title"]}>
        {title || "Đăng nhập"}
      </h2>

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
        disabled={loading}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
};


// "use client";
// import { useState } from "react";
// import { Lock, User, EyeOff, Eye} from "lucide-react";
// // import { Button, Input } from "@shared/core/components/ui";
// import  styles  from "./LoginCustom.module.css";

// import { useAuth } from "./useAuth.hook"; 

// interface LoginFormProps {
//   redirectPath?: string; // "/admin/dashboard" hoặc "/dashboard"
//   title?: string;
// }

// // ----------------------------------------------------
// // 1. INPUT CỤC BỘ
// // ----------------------------------------------------
// interface LocalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
//   name: string;
//   icon: React.ReactNode;
// }

// const LocalInput: React.FC<LocalInputProps> = ({ icon, ...props }) => (
//   <div className={styles["input-field"]}>
//     <input {...props} />
//     {icon}
//   </div>
// );

// // ----------------------------------------------------
// // 2. BUTTON CỤC BỘ
// // ----------------------------------------------------
// const LocalButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
//   <button className={styles["auth-button"]} {...props}>
//     {children}
//   </button>
// );
// //

// export const LoginForm = ({ redirectPath = "/dashboard", title }: LoginFormProps) => {
//   const [usernameOrPhone, setUsernameOrPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   // Giả định: useAuth đã được định nghĩa
//   const { login, loading } = {} as any; // Thay thế bằng useAuth thực tế

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // login(usernameOrPhone, password); // Logic đăng nhập thực tế
//     console.log("Submit:", { usernameOrPhone, password });
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="w-full max-w-md"
//     >
//       {/* Tiêu đề: Sử dụng CSS Class cho hiệu ứng Gradient */}
//       <h2 className={styles["auth-form-title"]}>
//         {title || "ĐĂNG NHẬP"}
//       </h2>

//       {/* Username Field */}
//       <LocalInput
//         type="text"
//         name="usernameOrPhone"
//         placeholder="Tên đăng nhập hoặc số điện thoại"
//         value={usernameOrPhone}
//         onChange={(e) => setUsernameOrPhone(e.target.value)}
//         icon={<User size={20} />}
//         required
//       />

//       {/* Password Field */}
//       <div className={styles["password-field"]}>
//         <input
//           type={showPassword ? "text" : "password"}
//           name="password"
//           placeholder="Mật khẩu"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         {/* Icon Eye/EyeOff */}
//         {showPassword ? (
//           <EyeOff size={20} onClick={() => setShowPassword(false)} />
//         ) : (
//           <Eye size={20} onClick={() => setShowPassword(true)} />
//         )}
//       </div>

//       {/* Button */}
//       <LocalButton type="submit" disabled={loading}>
//         {loading ? "Đang xử lý..." : "Đăng Nhập"}
//       </LocalButton>
//     </form>
//   );
// };
