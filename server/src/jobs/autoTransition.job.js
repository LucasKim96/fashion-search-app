import cron from "node-cron";
import { autoTransitionOrders } from "../modules/order/order.controller.js";

export default function startAutoTransitionJob() {
  // Chạy mỗi 15 phút
  cron.schedule("*/15 * * * *", async () => {
    console.log("[CRON] Running auto order transition...");
    try {
      await autoTransitionOrders();
      console.log("[CRON] ✅ Auto transition completed");
    } catch (err) {
      console.error("[CRON] ❌ Error in auto transition:", err);
    }
  });
}
