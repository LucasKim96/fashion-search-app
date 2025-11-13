"use client";

import React, { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button, Input,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@shared/core/components/ui";
import { useUser } from "@shared/features/user/user.hooks";
import { useAccount } from "@shared/features/account/account.hook";
import { UserProfile } from "@shared/core/utils/profile.utils";

interface Props {
    open: boolean;
    onClose: () => void;
    profile: UserProfile;
    type: "user" | "account";
}

export const ProfileEditDialog: React.FC<Props> = ({ open, onClose, profile, type }) => {
    const { updateBasicInfo: updateUserBasic } = useUser();
    const { updateBasicInfo: updateAccountBasic } = useAccount();

    const [form, setForm] = useState({
        name: profile.name || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        username: profile.username || "",
    });
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        setForm({
            name: profile.name || "",
            email: profile.email || "",
            phoneNumber: profile.phoneNumber || "",
            username: profile.username || "",
        });
    }, [profile]);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (type === "user") {
                await updateUserBasic(profile.userId, { name: form.name, email: form.email });
            } else {
                await updateAccountBasic(profile.accountId, { username: form.username, phoneNumber: form.phoneNumber });
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>
                {type === "user" ? "Cập nhật thông tin cá nhân" : "Cập nhật thông tin tài khoản"}
            </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
            {type === "user" ? (
                <>
                <Input
                    label="Tên"
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
                <Input
                    label="Tên đăng nhập"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
                <Input
                    label="Số điện thoại"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
                </>
            )}
            </div>

            <DialogFooter>
            <Button variant="outline" onClick={onClose}>
                Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
                {   saving ? "Đang lưu..." : "Lưu"}
            </Button>

            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
};
