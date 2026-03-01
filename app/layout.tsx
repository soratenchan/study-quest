import type { Metadata } from "next";
import { M_PLUS_Rounded_1c, Press_Start_2P } from "next/font/google";
import "./globals.css";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-rounded',
  display: 'swap',
});

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "StudyQuest",
  description: "バディ型エンジニア目標管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${mPlusRounded.variable} ${pressStart.variable} antialiased bg-[#FAFAFA] text-[#1A1A1A] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
