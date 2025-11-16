"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
    imageUrl?: string;
    alt?: string;
    open: boolean;
    onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    imageUrl,
    alt = "Preview",
    open,
    onClose,
}) => {
    return (
        <AnimatePresence>
        {open && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-20 fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center"
            >
                <div className="relative p-[3px] rounded-3xl bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                <div className="rounded-3xl bg-black/40 backdrop-blur-sm overflow-hidden border border-white/10">
                    <img
                    src={imageUrl || "/default-avatar.png"}
                    alt={alt}
                    className="object-contain max-w-[90vw] max-h-[80vh] rounded-2xl"
                    />
                </div>
                </div>

                <div className="absolute inset-0 rounded-3xl ring-1 ring-white/30 pointer-events-none"></div>

                <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                <X className="w-5 h-5" />
                </button>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
};
