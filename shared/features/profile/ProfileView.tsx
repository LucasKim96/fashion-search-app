"use client";

import React, { useState } from "react";
import { UserProfile, toInputDate, ROLES } from "@shared/core";
import {
	GradientButton,
	Input,
	Select,
	SelectItem,
	PasswordInput,
} from "@shared/core";
import {
	User, // Họ và tên
	Mail, // Email
	Calendar, // Ngày sinh / Ngày tạo
	UserCheck, // Giới tính
	Lock, // Thông tin tài khoản & quyền
	Key, // Đổi mật khẩu
	ShieldCheck, // Quyền hạn
	Zap,
	Edit3, // Icon chỉnh sửa
	X, // Icon Hủy
	Check, // Icon Lưu / Đổi mật khẩu
	Phone, // Số điện thoại
	Activity, // Cập nhật lần cuối
	LockKeyhole,
} from "lucide-react";

import { formatVNDate } from "@shared/core/utils/dateTime";
import { ProfileAvatarUploader } from "./ProfileAvatarUploader";
import { useProfileLogic } from "./profile.hooks";
import { useAuthContext } from "@shared/features/auth/AuthProvider";

interface Props {
	profile: UserProfile;
	// onUpdate?: () => void;
}

export const ProfileView: React.FC<Props> = ({ profile }) => {
	const { changePassword, refreshUser } = useAuthContext();
	const {
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
	} = useProfileLogic(profile, { changePassword, refreshUser });
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const genderMapping = {
		male: "Nam",
		female: "Nữ",
		other: "Khác",
	};
	return (
		<div className="flex flex-col items-center gap-6 p-0">
			<div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full max-w-4xl">
				{/* Avatar */}
				<div className="flex-shrink-0">
					<ProfileAvatarUploader
						profile={profile}
						size={160}
						onUpdate={refreshUser}
					/>
				</div>

				{/* Card thông tin */}
				<div className="flex-1 flex flex-col gap-4 w-full">
					{/* ===== TÀI KHOẢN & QUYỀN ===== */}
					<div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
								<Lock className="w-5 h-5 text-blue-500" />
								Thông tin tài khoản & quyền
							</h2>

							{/* Các nút hành động */}
							<div className="flex gap-2">
								{/* Mặc định */}
								{editSection !== "account" && !showPasswordDialog && (
									<>
										<GradientButton
											label="Chỉnh sửa"
											icon={Edit3}
											iconColor="text-white"
											labelColor="text-white"
											gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
											hoverGradient="hover:from-blue-600 hover:to-indigo-800"
											onClick={() => setEditSection("account")}
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
											roundedFull
											shadow
										/>
										<GradientButton
											label="Đổi mật khẩu"
											icon={Key}
											iconColor="text-white"
											labelColor="text-white"
											gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
											hoverGradient="hover:from-yellow-500 hover:to-orange-600"
											onClick={() => setShowPasswordDialog(true)}
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
											roundedFull
											shadow
										/>
									</>
								)}

								{/* Khi đang chỉnh sửa account */}
								{editSection === "account" && (
									<>
										<GradientButton
											label="Hủy"
											icon={X}
											iconColor="text-white"
											labelColor="text-white"
											gradient="bg-gradient-to-r from-gray-400 to-gray-500"
											hoverGradient="hover:from-gray-300 hover:to-gray-400"
											onClick={handleCancel}
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-sm"
											roundedFull
											shadow={false}
										/>
										<GradientButton
											label="Lưu"
											icon={Check}
											loading={saving}
											onClick={handleSaveAccount}
											className="flex items-center gap-2 px-3 py-1 text-sm"
											roundedFull
											shadow
										/>
									</>
								)}

								{/* Khi đang đổi mật khẩu */}
								{showPasswordDialog && (
									<>
										<GradientButton
											label="Hủy"
											icon={X}
											iconColor="text-white"
											labelColor="text-white"
											gradient="bg-gradient-to-r from-gray-400 to-gray-500"
											hoverGradient="hover:from-gray-300 hover:to-gray-400"
											onClick={() => setShowPasswordDialog(false)}
											className="flex items-center gap-2 px-3 py-1 text-sm shadow-sm"
											roundedFull
											shadow={false}
										/>
										<GradientButton
											label="Lưu mật khẩu"
											icon={Check}
											loading={saving}
											onClick={() =>
												handleChangePassword(() => setShowPasswordDialog(false))
											}
											className="flex items-center gap-2 px-3 py-1 text-sm"
											roundedFull
											shadow
										/>
									</>
								)}
							</div>
						</div>

						{/* Form thông tin tài khoản */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{editSection === "account" ? (
								<>
									<Input
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<User className="w-4 h-4" /> Tên đăng nhập
											</span>
										}
										value={form.username}
										onChange={(e) =>
											setForm({ ...form, username: e.target.value })
										}
									/>
									<Input
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<Phone className="w-4 h-4" /> Số điện thoại
											</span>
										}
										value={form.phoneNumber}
										onChange={(e) =>
											setForm({ ...form, phoneNumber: e.target.value })
										}
									/>
								</>
							) : (
								<>
									<div>
										<p className="font-semibold flex items-center gap-1 text-indigo-600">
											<User className="w-4 h-4" /> Tên đăng nhập
										</p>
										<p className="font-medium text-gray-800">
											{profile.username}
										</p>
									</div>
									<div>
										<p className="font-semibold flex items-center gap-1 text-indigo-600">
											<Phone className="w-4 h-4" /> Số điện thoại
										</p>
										<p className="font-medium text-gray-800">
											{profile.phoneNumber || "Chưa có"}
										</p>
									</div>
								</>
							)}
						</div>

						{/* Ngày tạo & Cập nhật */}
						<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<p className="font-semibold flex items-center gap-1 text-indigo-600">
									<Calendar className="w-4 h-4" /> Ngày tạo tài khoản
								</p>
								<p className="font-medium text-gray-800">
									{profile.createdAt
										? formatVNDate(profile.createdAt)
										: "Không có"}
								</p>
							</div>
							<div>
								<p className="font-semibold flex items-center gap-1 text-indigo-600">
									<Activity className="w-4 h-4" /> Cập nhật lần cuối
								</p>
								<p className="font-medium text-gray-800">
									{profile.updatedAt
										? formatVNDate(profile.updatedAt)
										: "Chưa cập nhật"}
								</p>
							</div>
						</div>

						{/* Trạng thái & quyền hạn */}
						<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-1">
								<p className="font-semibold flex items-center gap-1 text-indigo-600">
									<Zap className="w-4 h-4" /> Trạng thái tài khoản
								</p>
								<div
									className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full 
                            text-sm font-semibold 
                            bg-gray-200 dark:bg-gray-700 
                            text-gray-700 dark:text-gray-100
                            border border-gray-200 dark:border-gray-600
                            cursor-default
                            w-max" // <--- thêm w-max
								>
									<span
										className={`w-2 h-2 rounded-full ${
											profile.isBanned
												? "bg-red-400"
												: profile.status === "active"
												? "bg-green-400"
												: "bg-yellow-400"
										}`}></span>
									<span className="whitespace-nowrap">
										{profile.isBanned
											? "Bị cấm"
											: profile.status === "active"
											? "Đang hoạt động"
											: "Không hoạt động"}
									</span>
								</div>
							</div>
							{/* Quyền hạn */}
							<div className="flex flex-col gap-1">
								<p className="font-semibold flex items-center gap-1 text-indigo-600">
									<ShieldCheck className="w-4 h-4" /> Quyền hạn
								</p>
								<div className="flex flex-wrap gap-2">
									{profile.roles.length ? (
										profile.roles.map((role) => (
											<span
												key={role}
												className="px-2 py-0.5 rounded-full text-sm font-medium
                                  bg-blue-100 text-blue-700 border border-blue-200
                                  cursor-default" // bỏ con trỏ pointer
											>
												{ROLES[role]?.roleName || role}
											</span>
										))
									) : (
										<span className="text-gray-400 text-sm">Chưa có quyền</span>
									)}
								</div>
							</div>
						</div>
						{/* Phần đổi mật khẩu – hiển thị liền mạch với thông tin tài khoản */}
						{showPasswordDialog && (
							<>
								<hr className="my-6 border-t border-gray-200" />

								<h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
									<Key className="w-5 h-5 text-yellow-500" />
									Đổi mật khẩu
								</h2>

								<div className="grid grid-cols-2 gap-4 mt-5">
									<PasswordInput
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<LockKeyhole className="w-4 h-4" /> Mật khẩu cũ
											</span>
										}
										value={passwordForm.oldPassword}
										onChange={(val) =>
											setPasswordForm({ ...passwordForm, oldPassword: val })
										}
									/>

									{/* Hàng 1, cột phải để trống */}
									<div />

									<PasswordInput
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<LockKeyhole className="w-4 h-4" /> Mật khẩu mới
											</span>
										}
										value={passwordForm.newPassword}
										onChange={(val) =>
											setPasswordForm({ ...passwordForm, newPassword: val })
										}
									/>
									<PasswordInput
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<LockKeyhole className="w-4 h-4" /> Xác nhận mật khẩu
											</span>
										}
										value={passwordForm.confirmPassword}
										onChange={(val) =>
											setPasswordForm({ ...passwordForm, confirmPassword: val })
										}
									/>
								</div>
							</>
						)}
					</div>

					{/* ===== THÔNG TIN CÁ NHÂN ===== */}
					<div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
								<Edit3 className="w-5 h-5 text-green-500" />
								Thông tin cá nhân
							</h2>
							{editSection !== "user" ? (
								<GradientButton
									label="Chỉnh sửa"
									icon={Edit3}
									iconColor="text-white"
									labelColor="text-white"
									gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
									hoverGradient="hover:from-green-600 hover:to-emerald-700"
									onClick={() => setEditSection("user")}
									className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
									roundedFull
									shadow
								/>
							) : (
								<div className="flex gap-2">
									<GradientButton
										label="Hủy"
										icon={X}
										iconColor="text-white"
										labelColor="text-white"
										gradient="bg-gradient-to-r from-gray-400 to-gray-500"
										hoverGradient="hover:from-gray-300 hover:to-gray-400"
										onClick={handleCancel}
										className="flex items-center gap-2 px-3 py-1 text-sm shadow-sm"
										roundedFull={true}
										shadow={false}
									/>
									<GradientButton
										label="Lưu"
										icon={Check}
										loading={saving}
										onClick={handleSaveUser}
										className="flex items-center gap-2 px-3 py-1 text-sm"
										roundedFull={true}
										shadow={true}
									/>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{editSection === "user" ? (
								<>
									<Input
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<User className="w-4 h-4" /> Họ và tên
											</span>
										}
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
									/>
									<Input
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<Mail className="w-4 h-4" /> Email
											</span>
										}
										value={form.email}
										onChange={(e) =>
											setForm({ ...form, email: e.target.value })
										}
									/>
									<Input
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<Calendar className="w-4 h-4" /> Ngày sinh
											</span>
										}
										type="date"
										value={toInputDate(form.dayOfBirth)}
										onChange={(e) =>
											setForm({ ...form, dayOfBirth: e.target.value })
										}
									/>
									<Select
										label={
											<span className="font-semibold flex items-center gap-1 text-indigo-600">
												<UserCheck className="w-4 h-4" /> Giới tính
											</span>
										}
										value={form.gender}
										onValueChange={(value) =>
											setForm({
												...form,
												gender: value as "male" | "female" | "other",
											})
										}>
										<SelectItem value="male">Nam</SelectItem>
										<SelectItem value="female">Nữ</SelectItem>
										<SelectItem value="other">Khác</SelectItem>
									</Select>
								</>
							) : (
								<>
									<div>
										<p className="font-semibold flex items-center gap-1 text-indigo-600">
											<User className="w-4 h-4" /> Họ và tên
										</p>
										<p className="font-medium text-gray-800">
											{profile.name || "Chưa có tên"}
										</p>
									</div>
									<div>
										<p className="font-semibold flex items-center gap-1 text-indigo-600">
											<Mail className="w-4 h-4" /> Email
										</p>
										<p className="font-medium text-gray-800">
											{profile.email || "Chưa có email"}
										</p>
									</div>
									<div>
										<p className="font-semibold flex items-center gap-1 text-indigo-600">
											<Calendar className="w-4 h-4" /> Ngày sinh
										</p>
										<p className="font-medium text-gray-800">
											{profile.dayOfBirth
												? formatVNDate(profile.dayOfBirth)
												: "Chưa có"}
										</p>
									</div>
									<div>
										<p className="font-semibold flex items-center gap-1 text-indigo-600">
											<UserCheck className="w-4 h-4" /> Giới tính
										</p>
										<p className="font-medium text-gray-800">
											{profile.gender
												? genderMapping[profile.gender] || "Không xác định"
												: "Chưa xác định"}
										</p>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
