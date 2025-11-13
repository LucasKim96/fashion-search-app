"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/core/components/ui";
import { useAuth } from "@shared/features/auth";
import { parseUserProfile } from "@shared/core/utils/profile.utils";
import { ProfileView } from "@/features/profile/ProfileView";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-center text-lg">Đang tải thông tin...</div>;
  if (!user) return <div className="p-6 text-center text-lg text-red-500">Không tìm thấy tài khoản!</div>;

  const profile = parseUserProfile(user);

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card className="shadow-lg rounded-2xl border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold text-gray-800">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileView profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
