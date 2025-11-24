"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyOrdersApi } from "./order.api";
import { Order, OrderStatus } from "./order.types";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { errorUtils } from "@shared/core/utils";

export const useMyOrders = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		totalItems: 0,
	});

	// State cho filter
	const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
	const [page, setPage] = useState(1);

	const { showToast } = useNotification();

	const fetchOrders = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getMyOrdersApi({
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
			showToast(msg, "error");
		} finally {
			setLoading(false);
		}
	}, [page, statusFilter, showToast]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleStatusChange = (newStatus: OrderStatus | "all") => {
		setStatusFilter(newStatus);
		setPage(1); // Reset về trang 1 khi đổi filter
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
