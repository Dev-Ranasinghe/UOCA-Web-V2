"use client";

import Link from "next/link";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Mail, UserPlus, X } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { ImmersiveNavPanel } from "@/components/ui/immersive-full-screen-nav";

const LINKS = [
  { label: "Home", href: "/", page: "HOME" },
  { label: "Blog", href: "/blog", page: "BLOG" },
  { label: "Authors", href: "/authors", page: "AUTHORS" },
  { label: "Categories", href: "/categories", page: "CATEGORIES" },
  { label: "Projects", href: "/projects", page: "PROJECTS" },
  { label: "Newsletter", href: "/newsletter", page: "NEWSLETTER" },
  { label: "Calendar", href: "/calendar", page: "CALENDAR" },
  { label: "UOCA ID", href: "/leo-id", page: "UOCA ID" },
  { label: "Lynx", href: "/lynx", page: "LYNX" },
  { label: "Contact", href: "/contact", page: "CONTACT" },
  { label: "Team", href: "/team", page: "TEAM" },
];

const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com", Icon: FaFacebookF },
  { label: "Instagram", href: "https://instagram.com", Icon: FaInstagram },
  { label: "X (Twitter)", href: "https://twitter.com", Icon: FaXTwitter },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: FaLinkedinIn },
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The mobile menu: the immersive full-screen panel, dressed in the site's language (black section,
 * paper-coloured serif links, mono labels, `ooo ---- [LABEL]` header and dashed rules). It sits
 * under the site header, so the header's logo and toggle stay visible while it is open.
 */
export default function MobileNavPanel({
  open,
  onClose,
  activePage,
}: {
  open: boolean;
  onClose: () => void;
  activePage?: string;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  return (
    <ImmersiveNavPanel
      id="mobile-menu"
      open={open}
      onClose={onClose}
      overlayBg="#050505"
      clipOrigin="top"
      initialFocusRef={closeRef}
      className="z-40 md:hidden"
    >
      {(isOpen) => (
        <PanelContent isOpen={isOpen} onClose={onClose} activePage={activePage} closeRef={closeRef} />
      )}
    </ImmersiveNavPanel>
  );
}

function PanelContent({
  isOpen,
  onClose,
  activePage,
  closeRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Reveal the pieces one after another as the panel wipes open.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !isOpen) return;
    const items = root.querySelectorAll("[data-reveal]");
    gsap.killTweensOf(items);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      gsap.set(items, { y: 0, opacity: 1 });
      return;
    }
    gsap.fromTo(
      items,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.045, delay: 0.35 },
    );
    return () => void gsap.killTweensOf(items);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="flex min-h-full flex-col px-4 pb-8 pt-28 text-[#eae7e1] sm:px-6">
      {/* ooo ---- [CLOSE]: the site's header device, doubling as the in-panel close control */}
      <div data-reveal className="flex items-center gap-2 font-mono text-xs text-[#c9c4bb]">
        <span className="font-semibold tracking-[2px]">ooo</span>
        <div className="flex-1 border-b border-dashed border-[#eae7e1]/40" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          tabIndex={isOpen ? 0 : -1}
          className="inline-flex items-center gap-1.5 font-semibold tracking-wider text-[#eae7e1] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          [CLOSE] <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <ul className="mt-2">
        {LINKS.map((link, index) => {
          const active = activePage === link.page;
          return (
            <li
              key={link.href}
              data-reveal
              className="border-b border-dashed border-[#eae7e1]/25 last:border-b-0"
            >
              <Link
                href={link.href}
                onClick={onClose}
                tabIndex={isOpen ? 0 : -1}
                aria-current={active ? "page" : undefined}
                className="group flex items-baseline justify-between gap-4 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span
                  className={`font-serif text-[1.6rem] leading-none tracking-tight transition-colors ${
                    active ? "text-white underline decoration-dashed decoration-1 underline-offset-8" : "text-[#e6e1d8] group-active:text-white"
                  }`}
                >
                  {link.label}
                </span>
                <span className="font-mono text-[11px] tabular-nums tracking-[2px] text-[#c9c4bb]">
                  {pad(index + 1)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-8">
        <div data-reveal className="grid grid-cols-2 gap-3">
          <Link
            href="/subscribe"
            onClick={onClose}
            tabIndex={isOpen ? 0 : -1}
            className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#eae7e1] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[#121212] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            SUBSCRIBE <Mail className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/join"
            onClick={onClose}
            tabIndex={isOpen ? 0 : -1}
            className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#eae7e1] px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-[#eae7e1] transition-colors hover:bg-[#eae7e1] hover:text-[#121212] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            JOIN UOCA <UserPlus className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div
          data-reveal
          className="mt-6 flex items-center justify-between gap-4 border-t border-dashed border-[#eae7e1]/25 pt-5"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#c9c4bb]">
            Leo Club of UOC Alumni
          </span>
          <div className="flex items-center gap-4">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                tabIndex={isOpen ? 0 : -1}
                className="grid size-8 place-items-center text-[#eae7e1] transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
