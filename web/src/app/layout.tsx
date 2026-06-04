import type { Metadata } from "next";
import { Noto_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SETPulse — รายงานหุ้น SET / mai",
  description:
    "เว็บ SaaS ส่วนตัวสำหรับรายงานราคาหุ้นตลาด SET และ mai แบบ ณ เวลานั้น หรือดีเลย์ 10 วินาที",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
