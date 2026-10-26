import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({
  src: [
    { path: "./fonts/manrope-400.woff2", weight: "400" },
    { path: "./fonts/manrope-500.woff2", weight: "500" },
    { path: "./fonts/manrope-600.woff2", weight: "600" },
    { path: "./fonts/manrope-700.woff2", weight: "700" },
    { path: "./fonts/manrope-800.woff2", weight: "800" },
  ],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Калькулятор синергии продаж",
  description: "Примерный расчёт прироста выручки от автоматизации продаж в Instagram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
