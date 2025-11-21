"use client";

import { useState } from "react";
import { buildImageUrl } from "@shared/core";

export const ProductImages = ({ images }: { images: string[] }) => {
	const [selectedImage, setSelectedImage] = useState(images?.[0] || "");

	return (
		<div className="flex flex-col-reverse sm:flex-row gap-4">
			{/* Thumbnail list */}
			<div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto pr-2">
				{images.map((img, index) => (
					<button
						key={index}
						onClick={() => setSelectedImage(img)}
						className="flex-shrink-0">
						<img
							src={buildImageUrl(img)}
							alt={`Thumbnail ${index + 1}`}
							className="w-16 h-16 object-cover rounded-md border-2 hover:border-primary transition"
						/>
					</button>
				))}
			</div>
			{/* Main Image */}
			<div className="aspect-square w-full flex-1">
				<img
					src={buildImageUrl(selectedImage)}
					alt="Selected product"
					className="w-full h-full object-cover rounded-xl shadow-lg"
				/>
			</div>
		</div>
	);
};
