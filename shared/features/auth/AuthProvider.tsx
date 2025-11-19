"use client";

import React, { createContext, useContext, useEffect } from "react";
// 1. Import hook useAuth của bạn và các kiểu dữ liệu liên quan
import { useAuth } from "./useAuth.hook";

// 2. Định nghĩa kiểu cho giá trị mà Context sẽ cung cấp
// Lấy kiểu trả về của hook useAuth bằng `ReturnType`
type AuthContextType = ReturnType<typeof useAuth>;

// 3. Tạo Context
// createContext yêu cầu một giá trị mặc định. Chúng ta sẽ tạm dùng `undefined`.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Tạo component Provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	// Gọi hook useAuth của bạn MỘT LẦN DUY NHẤT ở đây
	const auth = useAuth();
	useEffect(() => {
		console.log("AUTH_PROVIDER: Trạng thái user đã thay đổi thành:", auth.user);
	}, [auth.user]);
	// Dùng AuthContext.Provider để "cung cấp" giá trị của `auth` cho tất cả các component con
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// 5. Tạo một custom hook để sử dụng Context một cách an toàn
// Đây sẽ là hook mà các component khác sẽ gọi thay vì gọi thẳng `useAuth`
export const useAuthContext = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
};
