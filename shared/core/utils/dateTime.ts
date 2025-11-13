export const formatVNDate = (date: string | Date): string => {
    const d = typeof date === "string" ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
    };

    return new Intl.DateTimeFormat("vi-VN", options).format(d);
};
export const toInputDate = (date?: string | null): string => {
    if (!date) return "";
    // Tách năm-tháng-ngày trực tiếp từ chuỗi ISO (cắt 10 ký tự đầu)
    // Ví dụ: "2003-08-22T00:00:00.000Z" -> "2003-08-22"
    return date.slice(0, 10);
};
