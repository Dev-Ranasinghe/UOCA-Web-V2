import type { Metadata } from "next";
import { Tinos, Plus_Jakarta_Sans, JetBrains_Mono, Arimo } from "next/font/google";
// Preloader disabled at the user's request (2026-09-19) — it was getting stuck
// fully opaque, hiding the whole site. Re-add `<Preloader />` below when asked.
// import Preloader from "@/components/Preloader";
import "./globals.css";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/PageTransition";
import PageReveal from "@/components/PageReveal";
import LynxRoot from "@/components/lynx/LynxRoot";

const fontSerif = Tinos({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const fontSans = Arimo({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UOCA - Leo Club",
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
      className={cn("antialiased", fontSerif.variable, fontMono.variable, "font-sans", fontSans.variable)}
    >
      <body className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
        <PageTransition />
        <PageReveal />
        {children}
        <LynxRoot />
      </body>
    </html>
  );
}

