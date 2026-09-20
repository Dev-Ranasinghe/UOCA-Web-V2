"use client";

import Link from "next/link";
import HalftoneBanner from "@/components/HalftoneBanner";
import SectionDivider from "@/components/SectionDivider";
import SubscribeForm from "@/components/subscribe/SubscribeForm";

export default function Footer() {
  return (
    <>
      {/* One section-gap above the footer on every page. */}
      <div className="mt-[var(--section-gap)]">
        <HalftoneBanner />
      </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 md:gap-10 lg:gap-8 pb-0 md:pb-12 md:border-b border-[#222]">
          {/* Left Column: Brand & Newsletter */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-1 mb-6">
                <span className="font-sans font-black text-2xl tracking-tighter uppercase text-white">
                  UOC ALUMNI
                </span>
              </Link>

              <h4 className="font-serif text-lg font-semibold text-white mb-3">
                Never miss an update
              </h4>

              <SubscribeForm variant="footer" source="footer" placeholder="Subscribe with your email" className="mb-3 max-w-md" />

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
          <div className="lg:col-span-7 flex flex-col md:grid md:grid-cols-3 md:gap-8">
            {/* Pages */}
            <div className="md:border-l border-[#222] md:pl-6">
              <h5 className="font-serif text-base font-semibold text-white mb-4">
                Pages
              </h5>
              <ul className="flex flex-wrap gap-x-5 gap-y-2.5 md:block md:space-y-2 text-xs font-mono text-[#aaa]">
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
                  <Link href="/projects" className="hover:text-white transition-colors">
                    PROJECTS
                  </Link>
                </li>
                <li>
                  <Link href="/newsletter" className="hover:text-white transition-colors">
                    NEWSLETTER
                  </Link>
                </li>
                <li>
                  <Link href="/calendar" className="hover:text-white transition-colors">
                    CALENDAR
                  </Link>
                </li>
                <li>
                  <Link href="/leo-id" className="hover:text-white transition-colors">
                    UOCA ID
                  </Link>
                </li>
                <li>
                  <Link href="/lynx" className="hover:text-white transition-colors">
                    LYNX
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    CONTACT
                  </Link>
                </li>
                <li>
                  <Link href="/team" className="hover:text-white transition-colors">
                    TEAM
                  </Link>
                </li>
                <li>
                  <Link href="/subscribe" className="hover:text-white transition-colors">
                    SUBSCRIBE
                  </Link>
                </li>
                <li>
                  <Link href="/join" className="hover:text-white transition-colors">
                    JOIN UOCA
                  </Link>
                </li>
              </ul>
            </div>

            <SectionDivider dark className="my-5 opacity-50 md:hidden" />

            {/* Projects */}
            <div className="md:border-l border-[#222] md:pl-6">
              <h5 className="font-serif text-base font-semibold text-white mb-4">
                Projects
              </h5>
              <ul className="flex flex-wrap gap-x-5 gap-y-2.5 md:block md:space-y-2 text-xs font-mono text-[#aaa]">
                <li>
                  <Link href="/projects" className="hover:text-white transition-colors">
                    ALL PROJECTS
                  </Link>
                </li>
                <li>
                  <Link href="/projects/timeless-legacy" className="hover:text-white transition-colors">
                    TIMELESS LEGACY
                  </Link>
                </li>
                <li>
                  <Link href="/projects/guardian" className="hover:text-white transition-colors">
                    GUARDIAN
                  </Link>
                </li>
                <li>
                  <Link href="/projects/blood-donation-camp" className="hover:text-white transition-colors">
                    BLOOD DONATION CAMP
                  </Link>
                </li>
                <li>
                  <Link href="/projects/community-beach-cleanup" className="hover:text-white transition-colors">
                    COMMUNITY BEACH CLEANUP
                  </Link>
                </li>
              </ul>
            </div>

            <SectionDivider dark className="my-5 opacity-50 md:hidden" />

            {/* Socials */}
            <div className="md:border-l border-[#222] md:pl-6">
              <h5 className="font-serif text-base font-semibold text-white mb-4">
                Socials
              </h5>
              <ul className="flex flex-wrap gap-x-5 gap-y-2.5 md:block md:space-y-2 text-xs font-mono text-[#aaa]">
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
            <SectionDivider dark className="my-5 opacity-50 md:hidden" />
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-0 md:pt-8 flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between md:gap-4 text-xs text-[#777] font-sans">
          <div>
            Designed by <span className="text-white font-medium">DANDY STUDIOS</span>
          </div>

          <span>© 2026 Dandy Studios.</span>
        </div>
      </div>
      </footer>
    </>
  );
}
