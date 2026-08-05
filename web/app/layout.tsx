import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Michiko Smart Ledger",
  description: "สมุดรายวันดิจิทัลสำหรับคลินิก ที่อ่านง่ายและเล่าเรื่องอย่างเป็นธรรมชาติ",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
