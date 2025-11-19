"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-40" />
    <DialogPrimitive.Content
      className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg ${className}`}
    >
      {/* Thêm fallback DialogTitle ẩn để Radix không cảnh báo */}
      <VisuallyHidden>
        <DialogPrimitive.Title>Dialog</DialogPrimitive.Title>
      </VisuallyHidden>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({ children }: any) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
);

export const DialogTitle = ({ children }: any) => (
  <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
);

export const DialogFooter = ({ children }: any) => (
  <div className="flex justify-end gap-2 mt-4">{children}</div>
);
