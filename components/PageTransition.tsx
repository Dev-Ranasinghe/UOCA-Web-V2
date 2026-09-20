"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";

/**
 * Page curtain: the same black "waterfall" as the mobile menu, on every page change and first load.
 *
 * - First load: the curtain is part of the server HTML (no flash of unstyled content); once the page has
 *   hydrated and fonts are ready, the black drains off the bottom edge.
 * - Navigation: an internal link click is intercepted, the black falls from the top edge to cover the page,
 *   the route changes underneath, then the black drains away to reveal the new page.
 *
 * It must never leave the site covered, so every stage has a way out: a CSS failsafe (scripts never ran),
 * a noscript rule, reduced-motion users never see it, real-time watchdogs (a hung navigation falls back to a
 * normal page load), and a reset when the browser restores a page from the back/forward cache.
 * The admin dashboard is excluded: it should load instantly.
 */

const COLLAPSED_TOP = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
const COVERED = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const COLLAPSED_BOTTOM = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";

const COVER_SECONDS = 0.5;
const REVEAL_SECONDS = 0.8;
const EASE = "power4.inOut";
/** How long a navigation may take before we give up and do a normal page load. */
const NAVIGATION_TIMEOUT_MS = 8000;
/** Don't hold the first-load curtain for fonts longer than this. */
const FONT_WAIT_MS = 900;

type Phase = "initial" | "idle" | "covering" | "waiting" | "revealing";

export default function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const disabled = pathname.startsWith("/admin");

  const curtainRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<Phase>("initial");
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const timersRef = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };
  const clearWork = () => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const hide = () => {
    const curtain = curtainRef.current;
    clearWork();
    phaseRef.current = "idle";
    if (curtain) {
      curtain.style.animation = "none";
      gsap.set(curtain, { clipPath: COVERED, visibility: "hidden", pointerEvents: "none" });
    }
  };

  const reveal = (delay = 0) => {
    const curtain = curtainRef.current;
    if (!curtain) return;
    clearWork();
    phaseRef.current = "revealing";
    gsap.set(curtain, { visibility: "visible", pointerEvents: "auto", clipPath: COVERED });
    tweenRef.current = gsap.to(curtain, {
      clipPath: COLLAPSED_BOTTOM,
      duration: REVEAL_SECONDS,
      delay,
      ease: EASE,
      onComplete: hide,
    });
    // Real-time backstop: a throttled tab or a dropped frame must not strand the curtain.
    later(hide, (delay + REVEAL_SECONDS) * 1000 + 700);
  };

  // First load: the curtain arrives in the server HTML; drain it once we're hydrated and fonts are ready.
  useEffect(() => {
    if (disabled) return;
    const curtain = curtainRef.current;
    if (!curtain) return;
    // Scripts are running, so the CSS failsafe is no longer needed. If it already fired (very slow
    // hydration), the curtain is hidden: keep it that way instead of bringing it back.
    const alreadyHidden = window.getComputedStyle(curtain).visibility === "hidden";
    curtain.style.animation = "none";

    if (alreadyHidden || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      hide();
      return;
    }

    let cancelled = false;
    // A timer, not requestAnimationFrame: rAF never fires in a background tab.
    const start = () => {
      if (cancelled || phaseRef.current !== "initial") return;
      reveal(0.05);
    };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((resolve) => window.setTimeout(resolve, FONT_WAIT_MS))]).then(start);

    return () => {
      cancelled = true;
      clearWork();
      phaseRef.current = "initial";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // The new route has committed: drain the curtain.
  useEffect(() => {
    if (disabled) return;
    if (phaseRef.current === "covering" || phaseRef.current === "waiting") {
      reveal(0.05);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, disabled]);

  // Intercept internal link clicks to run the cover animation before navigating.
  useEffect(() => {
    if (disabled) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const begin = (url: URL) => {
      const curtain = curtainRef.current;
      if (!curtain) return;
      clearWork();
      phaseRef.current = "covering";
      const target = url.pathname + url.search + url.hash;
      let navigated = false;

      const go = () => {
        if (navigated) return;
        navigated = true;
        phaseRef.current = "waiting";
        router.push(target);
        // If the navigation never lands, fall back to a normal page load rather than hang.
        later(() => {
          if (phaseRef.current === "waiting") window.location.assign(target);
        }, NAVIGATION_TIMEOUT_MS);
      };

      gsap.set(curtain, { visibility: "visible", pointerEvents: "auto", clipPath: COLLAPSED_TOP });
      tweenRef.current = gsap.to(curtain, { clipPath: COVERED, duration: COVER_SECONDS, ease: EASE, onComplete: go });
      later(go, COVER_SECONDS * 1000 + 400);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.hasAttribute("download") || anchor.hasAttribute("data-no-transition")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Only real page changes: query-only and hash-only links (filters, in-page anchors) navigate normally.
      if (url.pathname === window.location.pathname) return;
      if (url.pathname.startsWith("/admin")) return;
      if (phaseRef.current !== "idle") {
        // A transition is already running; don't stack another one.
        event.preventDefault();
        return;
      }

      event.preventDefault();
      begin(url);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [disabled, router]);

  // Browser back/forward cache can restore a page mid-transition; never leave it covered.
  useEffect(() => {
    if (disabled) return;
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) hide();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Leaving the page: stop any running work.
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (disabled) return null;

  return (
    <>
      <div
        ref={curtainRef}
        aria-hidden="true"
        data-page-curtain
        className="page-curtain fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#050505] text-[#eae7e1]"
        style={{ clipPath: COVERED }}
      >
        <span className="font-sans text-3xl font-black uppercase tracking-tighter">UOCA LEO</span>
        <span className="animate-pulse font-mono text-xs font-semibold tracking-[2px] text-[#c9c4bb]">ooo</span>
      </div>
      {/* Without scripts nothing would ever remove the curtain. */}
      <noscript>
        <style>{".page-curtain{display:none !important}"}</style>
      </noscript>
    </>
  );
}
