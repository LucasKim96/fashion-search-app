"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error" | "info";

interface Toast {
  message: string;
  type: ToastType;
}

interface NotificationContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextProps | null>(null);

export const useNotification = (): NotificationContextProps => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);

  const TOAST_DURATION = 4000;

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });

    const timer = setTimeout(() => setToast(null), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const [toastRoot, setToastRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let root = document.getElementById("toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "toast-root";
      document.body.appendChild(root);
    }
    setToastRoot(root);
  }, []);
  
  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
      {toast && toastRoot &&
        createPortal(
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] w-full flex justify-center pointer-events-none">
            <div
              className={clsx(
      "flex items-center gap-3 px-6 py-3 rounded-lg shadow-lg text-white font-medium text-sm pointer-events-auto justify-center animate-fade-in",
      "w-[500px] min-w-[300px] max-w-[90vw]",
      {
                  "bg-green-600": toast.type === "success",
                  "bg-red-500": toast.type === "error",
                  "bg-blue-500": toast.type === "info",
                }
              )}
            >
              {toast.type === "success" && <CheckCircle size={20} />}
              {toast.type === "error" && <AlertTriangle size={20} />}
              {toast.type === "info" && <Info size={20} />}
              <span className="text-center break-words">{toast.message}</span>
            </div>
          </div>,
          toastRoot
        )}
    </NotificationContext.Provider>
  );
};
