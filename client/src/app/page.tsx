"use client";

import React from "react";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

// Import các section đã tách
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col bg-bg-alt text-text">
			<ClientHeader />

			<main className="flex-grow w-full max-w-7xl mx-auto px-4 py-12 space-y-20">
				<HeroSection />
				<FeaturesSection />
				<FeaturedProductsSection />
			</main>

			<ClientFooter />
		</div>
	);
}
