// Ник в Telegram, куда ведёт кнопка «Обсудить в Telegram». Без @.
// Задаётся переменной NEXT_PUBLIC_TELEGRAM_USERNAME при сборке (например, в настройках Vercel).
export const TELEGRAM_USERNAME = (process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "").replace(/^@/, "").trim();

export const SOURCES_URL = "https://github.com/RasulDev1/profit-audit/blob/main/docs/sources.md";
