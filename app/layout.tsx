import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Аудит скрытых потерь прибыли",
  description: "Сервис показывает, где бизнес теряет прибыль из-за ручного учёта клиентов",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
