"use client";

import React, { useState } from "react";
import { UserProfile } from "@shared/core/utils/profile.utils";
import { Button } from "@shared/core/components/ui";
import { Pencil, Lock, UserCog } from "lucide-react";
import { formatVNDate } from "@shared/core/utils/dateTime";
import { ProfileEditDialog, ProfileAvatarUploader, ProfilePasswordDialog } from "./index";


interface Props {
    profile: UserProfile;
}

export const ProfileView: React.FC<Props> = ({ profile }) => {
    const [showEditUser, setShowEditUser] = useState(false);
    const [showEditAccount, setShowEditAccount] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex flex-col items-center gap-6">
        {/* ===== Avatar ===== */}
        <div className="relative group">
            <ProfileAvatarUploader profile={profile} />
        </div>

        {/* ===== Basic Info ===== */}
        <div className="text-center">
            <h2 className="text-2xl font-semibold">{profile.name || "Chưa có tên"}</h2>
            <p className="text-gray-600">{profile.email || "Chưa có email"}</p>
            <p className="text-sm text-gray-500">Tài khoản: {profile.username}</p>
            <p className="text-sm text-gray-500 mt-1">
            Ngày tạo: {formatVNDate(profile.createdAt ?? new Date())}
            </p>
        </div>

        {/* ===== Buttons ===== */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Button variant="outline" onClick={() => setShowEditUser(true)}>
            <UserCog className="w-4 h-4 mr-2" /> Cập nhật thông tin cá nhân
            </Button>
            <Button variant="outline" onClick={() => setShowEditAccount(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Cập nhật tài khoản
            </Button>
            <Button variant="default" onClick={() => setShowPassword(true)}>
            <Lock className="w-4 h-4 mr-2" /> Đổi mật khẩu
            </Button>
        </div>

        {/* Dialogs */}
        <ProfileEditDialog
            type="user"
            open={showEditUser}
            onClose={() => setShowEditUser(false)}
            profile={profile}
        />
        <ProfileEditDialog
            type="account"
            open={showEditAccount}
            onClose={() => setShowEditAccount(false)}
            profile={profile}
        />
        <ProfilePasswordDialog open={showPassword} onClose={() => setShowPassword(false)} />
        </div>
    );
};
