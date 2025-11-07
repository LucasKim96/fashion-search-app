"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextProps | null>(
  null
);

export const useNotification = (): NotificationContextProps => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove sau 3 giây
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-white animate-fade-in",
              toast.type === "success" && "bg-green-600",
              toast.type === "error" && "bg-red-500",
              toast.type === "info" && "bg-blue-500"
            )}
          >
            {toast.type === "success" && <CheckCircle size={18} />}
            {toast.type === "error" && <AlertTriangle size={18} />}
            {toast.type === "info" && <Info size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
