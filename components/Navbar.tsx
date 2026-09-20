"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Mail, Zap, Heart, Briefcase, Utensils, Plane, Laptop, Sparkles, UserPlus } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import MobileNavPanel from "@/components/MobileNavPanel";

interface NavbarProps {
  activePage?: string;
}

export default function Navbar({ activePage = "HOME" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY < 80) {
        setShowNav(true);
      } else if (currentY > lastScrollY.current) {
        setShowNav(false);
      } else if (currentY < lastScrollY.current) {
        setShowNav(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The full-screen menu is mobile-only; make sure it never stays open (or locks scroll) on a wider screen.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const categories = [
    { label: "FINANCE", icon: Zap },
    { label: "HEALTH", icon: Heart },
    { label: "BUSINESS", icon: Briefcase },
    { label: "FOOD", icon: Utensils },
    { label: "TRAVEL", icon: Plane },
    { label: "LIFESTYLE", icon: Sparkles },
    { label: "TECH", icon: Laptop },
  ];

  return (
    <>
      {/* Top Header Row: sticky, and slides away on scroll-down / reappears on scroll-up */}
      <header
        className={`sticky top-0 z-50 w-full bg-[#eae7e1] text-[#121212] md:border-b md:border-[#121212] transition-transform duration-300 ${
          showNav || mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-sans font-black text-[1.75rem] md:text-2xl tracking-tighter uppercase">
            READO
          </span>
          <span className="text-[10px] font-mono align-super font-bold">TM</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono font-semibold tracking-wider">
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
        <div className="flex items-center gap-2.5 md:hidden">
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

      {/* Mobile: the plus-ended divider under the header row */}
      <div className="md:hidden px-4 sm:px-6 pb-0">
        <SectionDivider />
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden px-4 py-2 bg-[#dfdcd5] border-t border-b border-[#121212]">
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
        <div className="w-full overflow-hidden bg-[#eae7e1] pt-8 pb-5 md:py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative w-full" style={{ aspectRatio: "2172 / 208" }}>
              <Image
                src="/images/uoc-alumni-logo.png"
                alt="UOC Alumni"
                fill
                className="object-cover"
                style={{ objectPosition: "center 47%" }}
                priority
              />
            </div>
          </div>
        </div>

        {/* Category Ticker Bar */}
        <div className="w-full bg-[#0d0d0d] text-white text-xs font-mono py-2.5 border-t border-b border-[#121212] overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between min-w-max gap-6 md:gap-8">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <React.Fragment key={cat.label}>
                  <Link
                    href={`/blog?category=${cat.label.toLowerCase()}`}
                    className="flex items-center gap-2 hover:text-[#f0c808] transition-colors font-semibold tracking-wider uppercase text-[11px] sm:text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#f0c808]" />
                    <span>{cat.label}</span>
                  </Link>
                  {idx < categories.length - 1 && (
                    <span className="text-[#444] font-normal">|</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
