// Ported from Agentry's tools/notify.py — plain outbound Telegram Bot API call.
import { env } from "../config/env.js";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export async function notifyUser(message: string): Promise<string> {
  const token = env.telegramBotToken();
  const chatId = env.telegramChatId();

  if (!token || !chatId) {
    return "notifyUser failed: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — message not sent.";
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) {
      return `notifyUser failed: ${res.status} ${res.statusText}`;
    }
  } catch (err) {
    return `notifyUser failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  return "Message sent to user via Telegram.";
}
