"use client";

import { Instagram, Facebook, Twitter } from "lucide-react";

export default function ClientFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Copyright */}
        <p className="text-sm md:text-base">
          © {new Date().getFullYear()} FashionSearch. All rights reserved.
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-white transition">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="hover:text-white transition">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="#" className="hover:text-white transition">
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Optional: a top border line */}
      <div className="absolute top-0 left-0 w-full border-t border-gray-700"></div>
    </footer>
  );
}
