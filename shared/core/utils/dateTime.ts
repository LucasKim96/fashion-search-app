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
