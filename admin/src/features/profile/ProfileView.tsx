"use client";

import React, { useState } from "react";
import { UserProfile } from "@shared/core/utils/profile.utils";
import { Button, Input, Badge } from "@shared/core/components/ui";
import { Check, Edit3, Lock, X } from "lucide-react";
import { formatVNDate } from "@shared/core/utils/dateTime";
import { ProfileAvatarUploader } from "./ProfileAvatarUploader";

interface Props {
  profile: UserProfile;
}

export const ProfileView: React.FC<Props> = ({ profile }) => {
  const [editSection, setEditSection] = useState<"none" | "account" | "user">("none");
  const [form, setForm] = useState({
    name: profile.name || "",
    email: profile.email || "",
    phoneNumber: profile.phoneNumber || "",
    username: profile.username || "",
  });

  const handleCancel = () => {
    setForm({
      name: profile.name || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
      username: profile.username || "",
    });
    setEditSection("none");
  };

  const handleSave = () => {
    // TODO: gọi update API ở đây (updateAccountBasic / updateUserBasic)
    setEditSection("none");
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      {/* Avatar */}
      <div className="relative group">
        <ProfileAvatarUploader profile={profile} size={140} />
      </div>

      {/* Thông tin chia 2 phần */}
      <div className="w-full max-w-3xl space-y-8">
        {/* ========== PHẦN TÀI KHOẢN & QUYỀN ========== */}
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm p-6 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-500" />
              Thông tin tài khoản & quyền
            </h2>
            {editSection !== "account" ? (
              <Button
                variant="outline"
                onClick={() => setEditSection("account")}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Hủy
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Lưu
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            {editSection === "account" ? (
              <Input
                label="Tên đăng nhập"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            ) : (
              <div>
                <p className="text-sm text-gray-500">Tên đăng nhập</p>
                <p className="font-medium text-gray-800">{profile.username}</p>
              </div>
            )}

            {/* Phone */}
            {editSection === "account" ? (
              <Input
                label="Số điện thoại"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
            ) : (
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-medium text-gray-800">{profile.phoneNumber || "Chưa có"}</p>
              </div>
            )}

            {/* Roles */}
            <div className="col-span-full">
              <p className="text-sm text-gray-500">Quyền hạn</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.roles && profile.roles.length > 0 ? (
                  profile.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">Chưa có quyền</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========== PHẦN THÔNG TIN CÁ NHÂN ========== */}
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-green-500" />
              Thông tin cá nhân
            </h2>
            {editSection !== "user" ? (
              <Button
                variant="outline"
                onClick={() => setEditSection("user")}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Hủy
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Check className="w-4 h-4" /> Lưu
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editSection === "user" ? (
              <>
                <Input
                  label="Họ và tên"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-500">Họ và tên</p>
                  <p className="font-medium text-gray-800">{profile.name || "Chưa có tên"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{profile.email || "Chưa có email"}</p>
                </div>
              </>
            )}

            <div className="col-span-full">
              <p className="text-sm text-gray-500">Ngày tạo</p>
              <p className="font-medium text-gray-800">
                {formatVNDate(profile.createdAt ?? new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// "use client";

// import React, { useState } from "react";
// import { UserProfile } from "@shared/core/utils/profile.utils";
// import { Button } from "@shared/core/components/ui";
// import { Pencil, Lock, UserCog } from "lucide-react";
// import { formatVNDate } from "@shared/core/utils/dateTime";
// import { ProfileEditDialog, ProfileAvatarUploader, ProfilePasswordDialog } from "./index";


// interface Props {
//     profile: UserProfile;
// }

// export const ProfileView: React.FC<Props> = ({ profile }) => {
//     const [showEditUser, setShowEditUser] = useState(false);
//     const [showEditAccount, setShowEditAccount] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);

//     return (
//         <div className="flex flex-col items-center gap-6">
//         {/* ===== Avatar ===== */}
//         <div className="relative group">
//             <ProfileAvatarUploader profile={profile} />
//         </div>

//         {/* ===== Basic Info ===== */}
//         <div className="text-center">
//             <h2 className="text-2xl font-semibold">{profile.name || "Chưa có tên"}</h2>
//             <p className="text-gray-600">{profile.email || "Chưa có email"}</p>
//             <p className="text-sm text-gray-500">Tài khoản: {profile.username}</p>
//             <p className="text-sm text-gray-500 mt-1">
//             Ngày tạo: {formatVNDate(profile.createdAt ?? new Date())}
//             </p>
//         </div>

//         {/* ===== Buttons ===== */}
//         <div className="flex flex-wrap justify-center gap-4 mt-4">
//             <Button variant="outline" onClick={() => setShowEditUser(true)}>
//             <UserCog className="w-4 h-4 mr-2" /> Cập nhật thông tin cá nhân
//             </Button>
//             <Button variant="outline" onClick={() => setShowEditAccount(true)}>
//             <Pencil className="w-4 h-4 mr-2" /> Cập nhật tài khoản
//             </Button>
//             <Button variant="default" onClick={() => setShowPassword(true)}>
//             <Lock className="w-4 h-4 mr-2" /> Đổi mật khẩu
//             </Button>
//         </div>

//         {/* Dialogs */}
//         <ProfileEditDialog
//             type="user"
//             open={showEditUser}
//             onClose={() => setShowEditUser(false)}
//             profile={profile}
//         />
//         <ProfileEditDialog
//             type="account"
//             open={showEditAccount}
//             onClose={() => setShowEditAccount(false)}
//             profile={profile}
//         />
//         <ProfilePasswordDialog open={showPassword} onClose={() => setShowPassword(false)} />
//         </div>
//     );
// };
