"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import HalftoneBanner from "@/components/HalftoneBanner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <>
      <HalftoneBanner />
      <footer className="w-full bg-[#000000] text-white pt-12 pb-8 border-t-2 border-[#121212] font-sans">
      {/* Plus-Dashed Top Divider Line */}
      <div className="max-w-7xl mx-auto px-4 mb-10 flex items-center gap-2 text-xs font-mono text-[#555]">
        <span>+</span>
        <div className="flex-1 border-b border-dashed border-[#333]"></div>
        <span>+</span>
        <div className="flex-1 border-b border-dashed border-[#333]"></div>
        <span>+</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-[#222]">
          {/* Left Column: Brand & Newsletter */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-1 mb-6">
                <span className="font-sans font-black text-2xl tracking-tighter uppercase text-white">
                  READO
                </span>
                <span className="text-[10px] font-mono align-super font-bold text-white">
                  TM
                </span>
              </Link>

              <h4 className="font-serif text-lg font-semibold text-white mb-3">
                Never miss an update
              </h4>

              <form onSubmit={handleSubscribe} className="mb-3 max-w-md">
                <div className="relative flex items-center bg-[#111111] border border-[#333] rounded-md p-1.5 focus-within:border-white transition-colors">
                  <input
                    type="email"
                    required
                    placeholder="Subscribe with your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-1.5 bg-transparent text-white placeholder-[#777] outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-white text-black px-4 py-1.5 rounded text-xs font-mono font-bold tracking-wider hover:bg-[#eae7e1] transition-colors whitespace-nowrap"
                  >
                    {submitted ? "DONE ✓" : "SUBSCRIBE"}
                  </button>
                </div>
              </form>

              <p className="text-[11px] text-[#777]">
                By subscribing to Reado&apos;s newsletter, you agree to our{" "}
                <Link href="/subscribe" className="underline hover:text-white">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Right Columns: Links */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Pages */}
            <div className="border-l border-[#222] pl-4 sm:pl-6">
              <h5 className="font-serif text-base font-semibold text-white mb-4">
                Pages
              </h5>
              <ul className="space-y-2 text-xs font-mono text-[#aaa]">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    HOME
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    BLOG
                  </Link>
                </li>
                <li>
                  <Link href="/authors" className="hover:text-white transition-colors">
                    AUTHORS
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-white transition-colors">
                    CATEGORIES
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    PODCAST
                  </Link>
                </li>
                <li>
                  <Link href="/authors" className="hover:text-white transition-colors">
                    ABOUT/CONTACT
                  </Link>
                </li>
                <li>
                  <Link href="/subscribe" className="hover:text-white transition-colors">
                    SUBSCRIBE
                  </Link>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div className="border-l border-[#222] pl-4 sm:pl-6">
              <h5 className="font-serif text-base font-semibold text-white mb-4">
                Categories
              </h5>
              <ul className="space-y-2 text-xs font-mono text-[#aaa]">
                <li>
                  <Link href="/blog?category=finance" className="hover:text-white transition-colors">
                    FINANCE
                  </Link>
                </li>
                <li>
                  <Link href="/blog?category=health" className="hover:text-white transition-colors">
                    HEALTH
                  </Link>
                </li>
                <li>
                  <Link href="/blog?category=business" className="hover:text-white transition-colors">
                    BUSINESS
                  </Link>
                </li>
                <li>
                  <Link href="/blog?category=food" className="hover:text-white transition-colors">
                    FOOD
                  </Link>
                </li>
                <li>
                  <Link href="/blog?category=travel" className="hover:text-white transition-colors">
                    TRAVEL
                  </Link>
                </li>
                <li>
                  <Link href="/blog?category=lifestyle" className="hover:text-white transition-colors">
                    LIFESTYLE
                  </Link>
                </li>
                <li>
                  <Link href="/blog?category=tech" className="hover:text-white transition-colors">
                    TECH
                  </Link>
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="border-l border-[#222] pl-4 sm:pl-6">
              <h5 className="font-serif text-base font-semibold text-white mb-4">
                Socials
              </h5>
              <ul className="space-y-2 text-xs font-mono text-[#aaa]">
                <li>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    FACEBOOK
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    INSTAGRAM
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    TWITTER/X
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    LINKEDIN
                  </a>
                </li>
                <li>
                  <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    PINTEREST
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777] font-sans">
          <div>
            Designed by <span className="text-white font-medium">DANDY STUDIOS</span>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 Reado. All rights reserved</span>

            {/* Floating Get it for FREE badge */}
            <Link
              href="/subscribe"
              className="hidden sm:inline-flex items-center gap-1.5 bg-white text-black px-3 py-1 rounded text-xs font-mono font-bold hover:bg-[#eae7e1] transition-colors"
            >
              <span>Get it for FREE</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
      </footer>
    </>
  );
}
