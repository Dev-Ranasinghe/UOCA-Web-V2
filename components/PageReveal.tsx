"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { PAGE_REVEAL_EVENT, preloaderIsUp } from "@/lib/page-intro";
import { isBareRoute } from "@/lib/bare-routes";

/**
 * Page arrival and scroll reveal for the content of <main>, on every page.
 *
 * - First screen: once the black curtain (components/PageTransition.tsx) starts draining off the bottom, the blocks in
 *   the first screen rise into place, top block first, so the curtain and the content read as one gesture.
 * - Below the fold: each block rises into place as it scrolls into view, once. GSAP does the animation; an
 *   IntersectionObserver decides when (it only fires when a block crosses the line, where ScrollTrigger recalculated
 *   every trigger on every scroll event). Blocks that enter together (the cards of one grid row) arrive in a short
 *   stagger. Full-bleed dark sections only fade: sliding a black band up would leave a gap behind it.
 * - Blocks are the direct children of <main>; a block that is a group of 2 to 12 children (a header, a grid, a column)
 *   is split, at most two levels deep, so its parts arrive one after another.
 *
 * Safety: content is hidden by script, after the page is covered, so nothing is hidden if scripts never run. The
 * first-screen arrival also has a fallback timer if the curtain's signal never comes, and cleanup restores every
 * element. If the curtain isn't up (browser back/forward, a redirect, a very slow first load) it plays straight away.
 * Reduced-motion users see no motion and nothing is hidden. The admin dashboard is excluded, like the curtain.
 * Opt a block out with `data-reveal="none"` (scroll-driven sections); `data-reveal="whole"` moves it as one piece.
 *
 * Timings live in the constants below and are tuned against the curtain's 0.8s power4.inOut drain.
 */

/** How far a block travels, in px: a little further when it scrolls in than when the page opens. */
const LOAD_SHIFT = 28;
const SCROLL_SHIFT = 36;
const DURATION = 1;
const EASE = "expo.out";
/** Total time spread across the first-screen stagger, however many blocks there are. */
const STAGGER_EACH = 0.09;
const STAGGER_TOTAL_MAX = 0.5;
/** The curtain's leading edge reaches the top of the page about this long after it starts draining. */
const CURTAIN_LEAD = 0.3;
/** If the curtain never signals, play the first-screen arrival anyway after this long. */
const FALLBACK_MS = 2500;
/** A block scrolls in when its top is this far up from the bottom of the viewport. */
const RISE_MARGIN = "0px 0px -10% 0px";
const FADE_MARGIN = "0px 0px -15% 0px";
const SCROLL_STAGGER = 0.09;
const MAX_SPLIT = 12;
const MAX_DEPTH = 2;

const REVEAL_EVENT = PAGE_REVEAL_EVENT;
/** On first load the preloader covers the page for about 5s, so wait for it (its own watchdog fires by about 8s). */
const PRELOADER_FALLBACK_MS = 10000;

type Unit = { el: HTMLElement; fade: boolean };

function usable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "NOSCRIPT") return false;
  if (el.dataset.reveal === "none") return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const position = window.getComputedStyle(el).position;
  return position !== "fixed" && position !== "absolute";
}

/** Split a block into the parts that arrive one after another. */
function collect(el: HTMLElement, depth: number, out: Unit[]) {
  if (el.classList.contains("section-dark")) {
    out.push({ el, fade: true });
    return;
  }
  const parts = depth >= MAX_DEPTH || el.dataset.reveal === "whole" ? [] : Array.from(el.children).filter(usable);
  if (parts.length >= 2 && parts.length <= MAX_SPLIT) {
    parts.forEach((part) => collect(part, depth + 1, out));
  } else {
    out.push({ el, fade: false });
  }
}

function topOf(el: HTMLElement) {
  // Measured from the top of the document: a page opens at the top, and this stays right if scrolling hasn't reset yet.
  return el.getBoundingClientRect().top + window.scrollY;
}

export default function PageReveal() {
  const pathname = usePathname();

  // A layout effect: the new page is hidden before it is ever painted, while the curtain still covers it.
  useLayoutEffect(() => {
    if (isBareRoute(pathname)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.querySelector("main");
    if (!main) return;

    const units: Unit[] = [];
    Array.from(main.children)
      .filter(usable)
      .forEach((child) => collect(child, 0, units));
    if (units.length === 0) return;

    const viewportHeight = window.innerHeight;
    const first = units.filter((u) => topOf(u.el) < viewportHeight).sort((a, b) => topOf(a.el) - topOf(b.el));
    const later = units.filter((u) => topOf(u.el) >= viewportHeight);
    const all = units.map((u) => u.el);

    gsap.set(
      first.map((u) => u.el),
      { opacity: 0, y: LOAD_SHIFT },
    );
    later.forEach((u) => gsap.set(u.el, { opacity: 0, y: u.fade ? 0 : SCROLL_SHIFT }));

    // Below the fold: reveal as each block scrolls into view.
    const rises = later.filter((u) => !u.fade).map((u) => u.el);
    const fades = later.filter((u) => u.fade).map((u) => u.el);
    const observers: IntersectionObserver[] = [];
    const watch = (elements: HTMLElement[], margin: string) => {
      if (elements.length === 0) return;
      const observer = new IntersectionObserver(
        (entries) => {
          const arriving: Element[] = [];
          const behind: Element[] = [];
          for (const entry of entries) {
            const above = entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
            if (entry.isIntersecting) arriving.push(entry.target);
            // Already scrolled past (a reload or Back that restores a scrolled position): show it, don't animate it.
            else if (above) behind.push(entry.target);
            else continue;
            observer.unobserve(entry.target);
          }
          if (behind.length) gsap.set(behind, { clearProps: "opacity,transform" });
          if (arriving.length) {
            arriving.sort((x, y) => x.getBoundingClientRect().top - y.getBoundingClientRect().top);
            gsap.to(arriving, {
              opacity: 1,
              y: 0,
              duration: DURATION,
              ease: EASE,
              stagger: SCROLL_STAGGER,
              overwrite: true,
              clearProps: "opacity,transform",
            });
          }
        },
        { rootMargin: margin },
      );
      elements.forEach((el) => observer.observe(el));
      observers.push(observer);
    };
    watch(rises, RISE_MARGIN);
    watch(fades, FADE_MARGIN);

    // First screen: play with the curtain.
    let tween: gsap.core.Tween | null = null;
    let timer: number | undefined;
    let played = first.length === 0;

    const play = (delay: number) => {
      if (played) return;
      played = true;
      window.removeEventListener(REVEAL_EVENT, onReveal);
      window.clearTimeout(timer);
      tween = gsap.to(
        first.map((u) => u.el),
        {
          opacity: 1,
          y: 0,
          duration: DURATION,
          ease: EASE,
          delay,
          stagger: { amount: Math.min(STAGGER_EACH * (first.length - 1), STAGGER_TOTAL_MAX) },
          clearProps: "opacity,transform",
        },
      );
    };
    function onReveal(event: Event) {
      const lead = (event as CustomEvent<{ delay?: number }>).detail?.delay ?? 0;
      play(lead + CURTAIN_LEAD);
    }

    if (!played) {
      const curtain = document.querySelector("[data-page-curtain]");
      const introUp = preloaderIsUp();
      const curtainUp = !!curtain && window.getComputedStyle(curtain).visibility !== "hidden";
      if (curtainUp || introUp) {
        window.addEventListener(REVEAL_EVENT, onReveal);
        timer = window.setTimeout(() => play(0), introUp ? PRELOADER_FALLBACK_MS : FALLBACK_MS);
      } else {
        play(0.05);
      }
    }

    return () => {
      played = true;
      window.removeEventListener(REVEAL_EVENT, onReveal);
      window.clearTimeout(timer);
      tween?.kill();
      observers.forEach((observer) => observer.disconnect());
      gsap.killTweensOf(all);
      gsap.set(all, { clearProps: "opacity,transform" });
    };
  }, [pathname]);

  return null;
}
