import moment from "moment-timezone";

// account: document từ MongoDB có lastActive và status
export const getLastActiveString = (account) => {
  if (!account.lastActive) return "Chưa từng đăng nhập";

  if (account.status === "active") return "Đang đăng nhập";

  // Nếu đăng xuất thì tính thời gian từ lastActive
  const last = moment(account.lastActive).tz("Asia/Ho_Chi_Minh");
  const now = moment().tz("Asia/Ho_Chi_Minh");

  const diffMinutes = now.diff(last, "minutes");
  const diffHours = now.diff(last, "hours");
  const diffDays = now.diff(last, "days");

  if (diffMinutes < 1) return "Vừa đăng xuất";
  if (diffMinutes < 60) return `Đăng xuất ${diffMinutes} phút trước`;
  if (diffHours < 24) return `Đăng xuất  ${diffHours} giờ trước`;
  if (diffDays < 365) return `Đăng xuất ${diffDays} ngày trước`;
  return `Đăng xuất ${Math.floor(diffDays / 365)} năm trước`;
};
