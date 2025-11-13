"use client";

import { Input } from "@shared/core/components/ui";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordInputProps {
    label: React.ReactNode; 
    value: string;
    onChange: (val: string) => void;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ label, value, onChange }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
        <Input
            type={show ? "text" : "password"}
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            className="absolute right-3 top-[44px] transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        >
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        </div>
    );
};
