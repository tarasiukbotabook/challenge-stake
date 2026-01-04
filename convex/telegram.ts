import { v } from "convex/values";
import { action } from "./_generated/server";

export const sendNotification = action({
  args: {
    telegramId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Получаем токен из environment variables Convex
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN not set");
      return { success: false, error: "Bot token not configured" };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: args.telegramId,
            text: args.message,
            parse_mode: "HTML",
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        console.error("Telegram API error:", data);
        return { success: false, error: data.description };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending Telegram notification:", error);
      return { success: false, error: String(error) };
    }
  },
});
