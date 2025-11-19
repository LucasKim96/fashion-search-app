/**
 * Format số thành dạng tiền tệ Việt Nam (VND)
 * @param value - Số tiền cần format (number)
 * @returns Chuỗi đã format (VD: "100.000 ₫")
 */
export const formatCurrency = (value: number | string | undefined | null): string => {
    if (!value) return "0 ₫";
    
    const amount = typeof value === "string" ? parseFloat(value) : value;

    // Kiểm tra nếu không phải là số hợp lệ
    if (isNaN(amount)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0, // Tiền Việt thường không dùng số thập phân
    }).format(amount);
};