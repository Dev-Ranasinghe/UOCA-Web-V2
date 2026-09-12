import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Preloader from "@/components/Preloader";
import { Pointer } from "@/components/ui/pointer";
import "./globals.css";

const fontSerif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "READO™ — Leo Club of Universities of Ceylon Alumni | Since 2016",
  description: "Discover stories, initiatives, and ideas that showcase how passionate Leos come together to serve communities, inspire change, and create lasting impact.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
        <Preloader />
        <Pointer />
        {children}
      </body>
    </html>
  );
}

