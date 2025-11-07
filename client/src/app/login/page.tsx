// "use client";

import React from "react";
import { LoginPage } from "@shared/features/auth/LoginPage";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";

export default function LoginClientPage() {
  return (
    <NotificationProvider>
      <LoginPage />
    </NotificationProvider>
  );
}
