"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Mail, Menu, X, Zap, Heart, Briefcase, Utensils, Plane, Laptop, Sparkles } from "lucide-react";

interface NavbarProps {
  activePage?: string;
}

export default function Navbar({ activePage = "HOME" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    <header className="w-full bg-[#eae7e1] text-[#121212] border-b border-[#121212]">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="font-sans font-black text-xl sm:text-2xl tracking-tighter uppercase">
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
            <span>•</span> HOME
          </Link>
          <Link
            href="/blog"
            className={`hover:opacity-75 transition-opacity flex items-center gap-1 ${
              activePage === "BLOG" ? "underline underline-offset-4 font-bold" : ""
            }`}
          >
            <span>▪</span> BLOG
          </Link>
          <Link
            href="/blog"
            className="hover:opacity-75 transition-opacity flex items-center gap-1"
          >
            PODCAST{" "}
            <span className="bg-[#f0c808] text-black px-1.5 py-0.5 text-[10px] rounded font-bold">
              5
            </span>
          </Link>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#555]" />
            <input
              type="text"
              placeholder="Search all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#dfdcd5] text-xs font-sans pl-8 pr-3 py-1.5 rounded text-[#121212] placeholder-[#666] outline-none focus:ring-1 focus:ring-[#121212] w-36 lg:w-44 transition-all"
            />
          </div>

          {/* Subscribe Button */}
          <Link
            href="/subscribe"
            className="bg-[#121212] text-white px-3.5 py-1.5 rounded-full hover:bg-[#333] transition-colors flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider"
          >
            SUBSCRIBE <Mail className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile / Tablet Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-[#121212] hover:bg-[#dfdcd5] rounded-full"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#121212] hover:bg-[#dfdcd5] rounded-md flex items-center gap-1 border border-[#121212]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
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

      {/* Mobile / Tablet Slide-over Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#eae7e1] border-b-2 border-[#121212] px-6 py-6 space-y-4 font-mono">
          <nav className="flex flex-col gap-4 text-sm font-bold tracking-wider">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-[#ccc] flex justify-between items-center"
            >
              <span>• HOME</span>
              <span className="text-xs font-normal">01</span>
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-[#ccc] flex justify-between items-center"
            >
              <span>▪ BLOG</span>
              <span className="text-xs font-normal">02</span>
            </Link>
            <Link
              href="/authors"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-[#ccc] flex justify-between items-center"
            >
              <span>AUTHORS</span>
              <span className="text-xs font-normal">03</span>
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-[#ccc] flex justify-between items-center"
            >
              <span>CATEGORIES</span>
              <span className="text-xs font-normal">04</span>
            </Link>
            <Link
              href="/subscribe"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 bg-[#121212] text-white py-3 px-4 rounded text-center font-bold flex items-center justify-center gap-2"
            >
              SUBSCRIBE TO NEWSLETTER <Mail className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}

      {/* Horizontal Line with + crosshair ticks */}
      <div className="w-full flex items-center text-[#121212] font-mono text-xs font-bold select-none px-2 sm:px-4">
        <span className="-mr-[3px] z-10">+</span>
        <div className="flex-1 border-b border-[#121212]"></div>
        <span className="-ml-[3px] z-10">+</span>
      </div>

      {/* Giant Hero READO Banner */}
      <div className="w-full overflow-hidden bg-[#eae7e1] py-4 sm:py-6">
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
    </header>
  );
}
