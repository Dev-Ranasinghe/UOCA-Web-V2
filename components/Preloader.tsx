"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { PAGE_REVEAL_EVENT, preloaderIsUp } from "@/lib/page-intro";

/**
 * First-load intro: a cream screen that says hello in a dozen languages, then lifts off the top with a curved
 * bottom edge. It only plays when the site is first loaded (the layout, and so this component, is not remounted when
 * you move between pages, which use the black curtain in PageTransition instead).
 *
 * - It is in the server HTML, so the very first paint is already the preloader. The black page curtain is switched off
 *   on first load (PageTransition checks for `[data-preloader]`), and PageReveal waits for this to lift.
 * - It must never be able to strand the page covered: a CSS failsafe in globals.css hides it if scripts never run, a
 *   real-time watchdog (not the animation clock, which stops in a background tab) finishes it if the timeline stalls,
 *   the scroll lock is always released, and reduced-motion users never see it. The admin dashboard skips it.
 */

const WORDS = [
  "Hello",
  "नमस्ते", // Hindi
  "Bonjour", // French
  "こんにちは", // Japanese
  "Guten tag", // German
  "你好", // Chinese
  "Olá", // Portuguese
  "Hallå", // Swedish
  "안녕하세요", // Korean
  "Ciao", // Italian
  "Hallo", // Dutch
  "ආයුබෝවන්", // Sinhala
];
const BG = "#eae7e1";
const LOCK_CLASS = "preloader-lock";

/** How long the first word is held, then each following word, then the last one before the exit. */
const FIRST_HOLD_S = 0.55;
const STEP_S = 0.26;
const LAST_HOLD_S = 0.55;
const EXIT_DELAY_S = 0.2;
const EXIT_S = 0.8;
/** If the exit hasn't finished this long after it should have, finish it anyway. */
const WATCHDOG_SLACK_MS = 2500;

export default function Preloader() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const preloaderRef = useRef<HTMLDivElement>(null);
  const wordElRef = useRef<HTMLParagraphElement>(null);
  const wordTextRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The admin dashboard needs to load instantly for someone trying to get work done, and reduced-motion users
    // get no intro (the stylesheet hides it for them).
    if (isAdmin) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const preloader = preloaderRef.current;
    // Scripts took so long that the stylesheet's failsafe already cleared it: stay out of the way.
    if (preloader && !preloaderIsUp()) {
      preloader.style.display = "none";
      return;
    }
    const wordEl = wordElRef.current;
    const wordText = wordTextRef.current;
    const path = pathRef.current;
    if (!preloader || !wordEl || !wordText || !path) return;

    // Scripts are running, so the CSS failsafe is no longer needed.
    preloader.style.animation = "none";
    // The scroll lock is a class on <html> (see `html.preloader-lock` in globals.css), not body.style.overflow: the mobile
    // menu panel resets that inline style when it mounts, which silently cancelled the lock.
    document.documentElement.classList.add(LOCK_CLASS);

    const dimension = { width: window.innerWidth, height: window.innerHeight };
    const getPaths = () => ({
      initialPath: `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height} L0 0`,
      targetPath: `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height} L0 0`,
    });
    path.setAttribute("d", getPaths().initialPath);
    wordText.textContent = WORDS[0];

    let finished = false;
    let announced = false;
    const announceReveal = () => {
      if (announced) return;
      announced = true;
      window.dispatchEvent(new CustomEvent(PAGE_REVEAL_EVENT, { detail: { delay: EXIT_DELAY_S } }));
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      document.documentElement.classList.remove(LOCK_CLASS);
      announceReveal();
      setDone(true);
    };

    // When each word appears, and when the exit starts.
    const exitAt = FIRST_HOLD_S + (WORDS.length - 2) * STEP_S + LAST_HOLD_S;
    const { initialPath, targetPath } = getPaths();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: finish });
      tl.to(wordEl, { opacity: 0.75, duration: 0.6, ease: "power1.out" }, 0.1);
      WORDS.forEach((word, i) => {
        if (i === 0) return;
        tl.call(
          () => {
            wordText.textContent = word;
          },
          [],
          FIRST_HOLD_S + (i - 1) * STEP_S,
        );
      });
      tl.call(announceReveal, [], exitAt);
      tl.to(wordEl, { opacity: 0, duration: 0.3 }, exitAt);
      tl.to(preloader, { y: "-100vh", duration: EXIT_S, ease: "power4.inOut" }, exitAt + EXIT_DELAY_S);
      tl.fromTo(
        path,
        { attr: { d: initialPath } },
        { attr: { d: targetPath }, duration: 0.7, ease: "power4.inOut" },
        exitAt + 0.3,
      );
      // Real-time backstop: a background tab pauses the animation clock, but timers still fire.
      const watchdog = window.setTimeout(() => {
        tl.kill();
        finish();
      }, (exitAt + EXIT_DELAY_S + EXIT_S) * 1000 + WATCHDOG_SLACK_MS);
      return () => window.clearTimeout(watchdog);
    }, preloader);

    const handleResize = () => {
      dimension.width = window.innerWidth;
      dimension.height = window.innerHeight;
      path.setAttribute("d", getPaths().initialPath);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      finished = true;
      window.removeEventListener("resize", handleResize);
      ctx.revert();
      document.documentElement.classList.remove(LOCK_CLASS);
    };
  }, [isAdmin]);

  if (done || isAdmin) return null;

  return (
    <>
      <div
        ref={preloaderRef}
        data-preloader
        aria-hidden="true"
        className="preloader fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
        style={{ background: BG }}
      >
        <p
          ref={wordElRef}
          className="absolute z-[2] flex items-center opacity-0 text-[#121212]"
          style={{ fontSize: 42, lineHeight: 1 }}
        >
          <span ref={wordTextRef} />
        </p>

        <svg className="absolute top-0 w-full" style={{ height: "calc(100% + 300px)" }} preserveAspectRatio="none">
          <path ref={pathRef} fill={BG} />
        </svg>
      </div>
      {/* Without scripts nothing would ever remove it. */}
      <noscript>
        <style>{".preloader{display:none !important}"}</style>
      </noscript>
    </>
  );
}
