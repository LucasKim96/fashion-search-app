// app/dashboard/profile/page.tsx
"use client";

import React from "react";
import { useAuth } from "@shared/features/auth";
import { parseUserProfile } from "@shared/core/utils/profile.utils";

export default function ProfilePage() {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading profile...</div>;
    if (!user) return <div>Không có thông tin người dùng.</div>;

    const profile = parseUserProfile(user);

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md mt-8">
        <div className="flex items-center gap-6">
            <img
            src={profile.avatarUrl || "/default-avatar.png"}
            alt={profile.name || profile.username}
            className="w-24 h-24 rounded-full object-cover border"
            />
            <div>
            <h1 className="text-2xl font-semibold">
                {profile.name || profile.username}
            </h1>
            <p className="text-gray-500">@{profile.username}</p>
            <p className="text-gray-600">{profile.email}</p>
            </div>
        </div>

        <div className="mt-6">
            <h2 className="text-xl font-medium mb-2">Thông tin tài khoản</h2>
            <ul className="space-y-1 text-gray-700">
            <li>
                <strong>Phone:</strong> {profile.phoneNumber}
            </li>
            <li>
                <strong>Status:</strong> {profile.status}
            </li>
            <li>
                <strong>Banned:</strong> {profile.isBanned ? "Yes" : "No"}
            </li>
            <li>
                <strong>Created At:</strong>{" "}
                {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
            </li>
            <li>
                <strong>Last Active:</strong>{" "}
                {profile.lastActiveVN || (profile.lastActive ? new Date(profile.lastActive).toLocaleString() : "-")}
            </li>
            </ul>
        </div>

        <div className="mt-6">
            <h2 className="text-xl font-medium mb-2">Roles</h2>
            <ul className="flex gap-3 flex-wrap">
            {profile.roles.map((r) => (
                <li
                key={r}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                {r}
                </li>
            ))}
            </ul>
        </div>

        {profile.dayOfBirth && profile.gender && (
            <div className="mt-6">
            <h2 className="text-xl font-medium mb-2">Thông tin cá nhân</h2>
            <ul className="space-y-1 text-gray-700">
                <li>
                <strong>Ngày sinh:</strong> {new Date(profile.dayOfBirth).toLocaleDateString()}
                </li>
                <li>
                <strong>Giới tính:</strong> {profile.gender}
                </li>
            </ul>
            </div>
        )}
        </div>
    );
}
