import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "事例分析ツール | Sales School",
  description: "課題啓蒙型営業 / 要件啓蒙 シナリオ構築ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
