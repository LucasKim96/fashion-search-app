"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/core/components/ui";
import { useAuth } from "@shared/features/auth";
import { parseUserProfile, UserProfile } from "@shared/core/utils/profile.utils";
import { ProfileView } from "@/features/profile/ProfileView";

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) setProfile(parseUserProfile(user));
  }, [user]);

  const handleProfileUpdate = async () => {
    if (refreshUser) {
      await refreshUser();
      if (user) setProfile(parseUserProfile(user));
    }
  };

  if (loading) return <div className="p-6 text-center text-lg">Đang tải thông tin...</div>;
  if (!profile) return <div className="p-6 text-center text-lg text-red-500">Không tìm thấy tài khoản!</div>;

  return (
<div className="container mx-auto max-w-5xl">
  <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
    <CardHeader className="pb-0">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 uppercase">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin cá nhân và quyền hạn</p>
      </div>
    </CardHeader>
    <CardContent>
      <ProfileView profile={profile} onUpdate={handleProfileUpdate} />
    </CardContent>
  </Card>
</div>

  );
}




// "use client";

// import React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@shared/core/components/ui";
// import { useAuth } from "@shared/features/auth";
// import { parseUserProfile } from "@shared/core/utils/profile.utils";
// import { ProfileView } from "@/features/profile/ProfileView";

// export default function ProfilePage() {
//   const { user, loading } = useAuth();

//   if (loading) return <div className="p-6 text-center text-lg">Đang tải thông tin...</div>;
//   if (!user) return <div className="p-6 text-center text-lg text-red-500">Không tìm thấy tài khoản!</div>;

//   const profile = parseUserProfile(user);

//   return (
//     <div className="container mx-auto max-w-4xl py-10">
//       <Card className="shadow-lg rounded-2xl border border-gray-200">
//         <CardHeader className="pb-2">
//           <CardTitle className="text-2xl font-semibold text-gray-800">Thông tin cá nhân</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ProfileView profile={profile} />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
