"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "@shared/features/user";
import { useAccount } from "@shared/features/account";
import { UserProfile } from "@shared/core/utils";

// interface UseProfileLogicOptions {
// 	onUpdate?: () => void; // Callback để refresh profile sau khi save
// }

// Định nghĩa một interface cho các dependency mà hook này cần
interface ProfileLogicDependencies {
	changePassword: (data: any) => Promise<any>;
	refreshUser: () => Promise<void>;
}

export const useProfileLogic = (
	profile: UserProfile,
	// options?: UseProfileLogicOptions
	dependencies: ProfileLogicDependencies
) => {
	const { updateBasicInfo: updateUserBasic } = useUser();
	const { updateBasicInfo: updateAccountBasic } = useAccount();
	const { changePassword, refreshUser } = dependencies;

	const [form, setForm] = useState({
		name: profile.name || "",
		email: profile.email || "",
		dayOfBirth: profile.dayOfBirth || "",
		gender: profile.gender || "other",
		phoneNumber: profile.phoneNumber || "",
		username: profile.username || "",
	});

	const [saving, setSaving] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [editSection, setEditSection] = useState<"none" | "account" | "user">(
		"none"
	);
	useEffect(() => {
		// Mỗi khi `profile` prop từ component cha thay đổi,
		// chúng ta sẽ reset lại state `form` với dữ liệu mới nhất.
		setForm({
			name: profile.name || "",
			email: profile.email || "",
			dayOfBirth: profile.dayOfBirth || "",
			gender: profile.gender || "other",
			phoneNumber: profile.phoneNumber || "",
			username: profile.username || "",
		});
	}, [profile]);

	const handleCancel = useCallback(() => {
		setForm({
			name: profile.name || "",
			email: profile.email || "",
			dayOfBirth: profile.dayOfBirth || "",
			gender: profile.gender || "other",
			phoneNumber: profile.phoneNumber || "",
			username: profile.username || "",
		});
		setEditSection("none");
	}, [profile]);

	// Save account info
	const handleSaveAccount = useCallback(async () => {
		if (!profile.accountId) return;
		setSaving(true);
		try {
			const res = await updateAccountBasic(profile.accountId, {
				username: form.username,
				phoneNumber: form.phoneNumber,
			});

			if (!res?.success) return; // Dừng, không đóng modal

			// refreshUser?.();
			// refresh profile
			// if (options?.onUpdate) options.onUpdate();
			// Chỉ đóng edit khi thành công

			await refreshUser();
			setEditSection("none");
		} catch (error) {
			//   console.error("Lỗi khi lưu tài khoản:", error);
			// Có thể show notification ở đây
		} finally {
			setSaving(false);
		}
	}, [profile.accountId, form, updateAccountBasic, refreshUser]);

	// Save user info
	const handleSaveUser = useCallback(async () => {
		if (!profile.userId) return;
		setSaving(true);
		try {
			const res = await updateUserBasic(profile.userId, {
				name: form.name,
				email: form.email,
				dayOfBirth: form.dayOfBirth || null,
				gender: form.gender,
			});
			if (!res?.success) return;

			// refreshUser luôn được gọi khi thành công
			// refreshUser?.();
			await refreshUser();
			// if (options?.onUpdate) options.onUpdate();
			setEditSection("none"); // Chỉ đóng khi thành công
		} catch (error) {
			//   console.error("Lỗi khi lưu thông tin cá nhân:", error);
			// Có thể show notification ở đây
		} finally {
			setSaving(false);
		}
	}, [profile.userId, form, updateUserBasic, refreshUser]);

	// Change password
	const handleChangePassword = useCallback(
		async (onSuccess?: () => void) => {
			setSaving(true);
			try {
				const res = await changePassword(passwordForm);
				// if (!res?.success) return;

				setPasswordForm({
					oldPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				setEditSection("none");

				// refreshUser sau khi đổi mật khẩu
				// refreshUser?.();
				await refreshUser();

				if (onSuccess) onSuccess();
			} finally {
				setSaving(false);
			}
		},
		[passwordForm, changePassword, refreshUser]
	);

	return {
		form,
		setForm,
		editSection,
		setEditSection,
		saving,
		passwordForm,
		setPasswordForm,
		handleCancel,
		handleSaveAccount,
		handleSaveUser,
		handleChangePassword,
	};
};
