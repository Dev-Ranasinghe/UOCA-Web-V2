"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Mail, UserPlus } from "lucide-react";
import MobileNavPanel from "@/components/MobileNavPanel";
import Ticker from "@/components/Ticker";

interface NavbarProps {
  activePage?: string;
}

/** The black strip under the wordmark scrolls these, in this order, forever. */
const TICKER_ITEMS = ["Lions Club of Galkissa", "Leo District 306 D1", "Leo Multiple District 306 Sri Lanka & Maldives"];

export default function Navbar({ activePage = "HOME" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let shown = true;
    let frame = 0;

    const setShown = (next: boolean) => {
      if (next === shown) return;
      shown = next;
      setShowNav(next);
    };

    // At most once per frame, and only touches React when the bar actually has to move.
    const update = () => {
      frame = 0;
      const currentY = window.scrollY;

      if (currentY < 80) {
        setShown(true);
      } else if (currentY > lastScrollY.current) {
        setShown(false);
      } else if (currentY < lastScrollY.current) {
        setShown(true);
      }

      lastScrollY.current = currentY;
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // The full-screen menu replaces the link row below xl (1280px), where the row would not fit; make sure it never
  // stays open (or locks scroll) once the screen is wide enough for the row.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (mq.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      {/* Top Header Row: sticky, and slides away on scroll-down / reappears on scroll-up */}
      <header
        className={`sticky top-0 z-50 w-full bg-[#eae7e1] text-[#121212] border-b border-[#121212] transition-transform duration-300 ${
          showNav || mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 xl:py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-serif font-bold text-[1.75rem] xl:text-2xl tracking-tight uppercase">
            UOCA
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden xl:flex items-center gap-6 text-xs font-mono font-semibold tracking-wider">
          <Link
            href="/"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "HOME" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            HOME
          </Link>
          <Link
            href="/blog"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "BLOG" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            BLOG
          </Link>
          <Link
            href="/projects"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "PROJECTS" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            PROJECTS
          </Link>
          <Link
            href="/newsletter"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "NEWSLETTER" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            NEWSLETTER
          </Link>
          <Link
            href="/calendar"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "CALENDAR" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            CALENDAR
          </Link>
          <Link
            href="/leo-id"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "UOCA ID" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            UOCA ID
          </Link>
          <Link
            href="/lynx"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "LYNX" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            LYNX
          </Link>
          <Link
            href="/contact"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "CONTACT" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            CONTACT
          </Link>
          <Link
            href="/team"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "TEAM" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            TEAM
          </Link>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#555]" />
            <input
              type="text"
              placeholder="Search all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#dfdcd5] text-xs font-sans pl-8 pr-3 py-1.5 rounded text-[#121212] placeholder-[#666] outline-none focus:ring-1 focus:ring-[#121212] w-24 lg:w-28 transition-all"
            />
          </div>

          {/* Subscribe Button */}
          <Link
            href="/subscribe"
            className="bg-[#121212] text-white px-3.5 py-1.5 rounded-full hover:bg-[#333] transition-colors flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider"
          >
            SUBSCRIBE <Mail className="w-3.5 h-3.5" />
          </Link>

          {/* Join UOCA Button */}
          <Link
            href="/join"
            className="bg-[#121212] text-white px-3.5 py-1.5 rounded-full hover:bg-[#333] transition-colors flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider"
          >
            JOIN UOCA <UserPlus className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Actions: search, subscribe, menu */}
        <div className="flex items-center gap-2.5 xl:hidden">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="grid size-10 place-items-center rounded-md bg-[#dfdcd5] text-[#121212] transition-colors hover:bg-[#d3cecb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <Search className="size-5" />
          </button>
          <Link
            href="/subscribe"
            className="grid size-10 place-items-center rounded-md bg-[#121212] text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
            aria-label="Subscribe to the newsletter"
          >
            <Mail className="size-5" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative grid size-10 place-items-center rounded-md bg-[#121212] text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <span
              aria-hidden="true"
              className={`absolute h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
                mobileMenuOpen ? "rotate-45" : "-translate-y-1"
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-out motion-reduce:transition-none ${
                mobileMenuOpen ? "-rotate-45" : "translate-y-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="xl:hidden px-4 py-2 bg-[#dfdcd5] border-t border-[#121212]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#555]" />
            <input
              type="text"
              placeholder="Search articles, authors, podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-sm pl-9 pr-3 py-2 rounded text-[#121212] outline-none"
              autoFocus
            />
          </div>
        </div>
      )}

      </header>

      <MobileNavPanel open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} activePage={activePage} />

      {/* Banner block: scrolls away normally, not part of the sticky bar */}
      <div className="w-full bg-[#eae7e1] text-[#121212]">
        {/* Giant Hero READO Banner */}
        <div className="w-full overflow-hidden bg-[#eae7e1]">
          {/* Same side padding as the header row so the wordmark lines up with the divider ends. The wordmark is
              ~7.8:1 (height = 12.8% of its width) and the space above/below it is a share of that same width, so the
              whole block scales as one piece, as in the Reado reference (a little shorter and tighter than it). */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pt-[3.5%] pb-[3.5%] xl:pt-[3%] xl:pb-[3.4%]">
              <div className="relative w-full aspect-[2144/430] md:aspect-[2144/275]">
                <Image
                  src="/images/uoc-alumni-wordmark.png"
                  alt="UOC Alumni"
                  fill
                  sizes="(min-width: 1280px) 1216px, 100vw"
                  className="object-fill"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling text strip: moves left, pauses on hover, static for reduced motion (see components/Ticker.tsx) */}
        <Ticker items={TICKER_ITEMS} label="Lions Club of Galkissa, Leo District 306 D1, Leo Multiple District 306 Sri Lanka and Maldives" />
      </div>
    </>
  );
}
