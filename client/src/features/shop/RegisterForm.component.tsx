"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterShopForm() {
	const [form, setForm] = useState({
		name: "",
		description: "",
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Form data:", form);
		// gọi API đăng ký shop ở đây
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow">
			<Input
				name="name"
				placeholder="Tên cửa hàng"
				value={form.name}
				onChange={handleChange}
			/>
			<Input
				name="description"
				placeholder="Mô tả ngắn"
				value={form.description}
				onChange={handleChange}
			/>

			<Button type="submit">Đăng ký</Button>
		</form>
	);
}
