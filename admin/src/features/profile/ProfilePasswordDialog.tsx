"use client";

import React, { useState } from "react";
import { Button, Input,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@shared/core/components/ui";
import { useAuth } from "@shared/features/auth";

export const ProfilePasswordDialog: React.FC<{ open: boolean; onClose: () => void }> = ({
    open,
    onClose,
}) => {
    const { changePassword } = useAuth();
    const [form, setForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleSubmit = async () => {
        await changePassword(form);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
            <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
            <Input
                type="password"
                label="Mật khẩu hiện tại"
                value={form.oldPassword}
                onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            />
            <Input
                type="password"
                label="Mật khẩu mới"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            <Input
                type="password"
                label="Xác nhận mật khẩu"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            </div>
            <DialogFooter>
            <Button variant="outline" onClick={onClose}>
                Hủy
            </Button>
            <Button onClick={handleSubmit}>Xác nhận</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
};
