"use client";

import { motion } from "framer-motion";
import RegisterShopForm from "@/features/shop/RegisterShopForm";

export default function RegisterShopPage() {
	return (
		<div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				className="w-full" // Chiếm toàn bộ chiều rộng của container p-8
			>
				<RegisterShopForm />
			</motion.div>
		</div>
	);
}
