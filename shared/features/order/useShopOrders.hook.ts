"use client";

import { useState, useEffect, useCallback } from "react";
import { getShopOrdersApi } from "./order.api"; // Import API của Seller
import { Order, OrderStatus } from "./order.types";
import { useNotification, errorUtils } from "@shared/core";

export const useShopOrders = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
	});

	// Filter states
	const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
	const [page, setPage] = useState(1);

	const { showToast } = useNotification();

	const fetchOrders = useCallback(async () => {
		setLoading(true);
		try {
			// Gọi API dành cho Shop
			const res = await getShopOrdersApi({
				page,
				limit: 10,
				status: statusFilter,
			});

			if (res.success && res.data) {
				setOrders(res.data.data);
				setPagination(res.data.pagination);
			}
		} catch (error) {
			const msg = errorUtils.parseApiError(error);
			// showToast(msg, "error"); // Có thể comment lại nếu không muốn hiện lỗi mỗi khi load
			console.error(msg);
		} finally {
			setLoading(false);
		}
	}, [page, statusFilter]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleStatusChange = (newStatus: OrderStatus | "all") => {
		setStatusFilter(newStatus);
		setPage(1);
	};

	return {
		orders,
		loading,
		pagination,
		statusFilter,
		handlePageChange,
		handleStatusChange,
		refetch: fetchOrders,
	};
};
