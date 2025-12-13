import React from "react";

export const Card = ({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<div
		className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
		{children}
	</div>
);

export const CardContent = ({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) => <div className={`p-4 ${className}`}>{children}</div>;
