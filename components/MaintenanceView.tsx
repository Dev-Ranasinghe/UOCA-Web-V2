"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AIMascot } from "@/components/ui/ask-ai";

/**
 * The page visitors see while maintenance mode is on (/admin/settings). LYNX, the club's blinking mascot from the chat
 * launcher, sits in the middle and asks them to wait, and keeps itself busy:
 *  - its eyes follow the cursor, and it perks up and says hi when the cursor comes close;
 *  - every second or two it does something on its own: a glance, hop, wiggle, nod, double bounce, squish, shake or spin
 *    (the moves are the `data-lynx-act` animations in globals.css), sometimes with a word in its bubble;
 *  - poke it (click or tap) and it reacts, with a different line each time, ending in "almost there!" after a few pokes;
 *  - its speech bubble cycles through a few lines;
 *  - when the site comes back it cheers and spins before sending the visitor home.
 * Visitors who ask for reduced motion get the bubble and the pokes as text only.
 *
 * It asks /api/maintenance every few seconds and sends visitors to the home page as soon as the site is back, so nobody has
 * to refresh. (Not while previewing from the admin panel: `?preview`.)
 */

type Act = "hop" | "wiggle" | "nod" | "bounce" | "spin" | "squish" | "shake";

const LINES = ["Hang tight!", "We'll be right back.", "Wait here with me.", "Almost there…"];
const LINE_MS = 3200;
const POLL_MS = 15000;

/** Eye travel before the mascot is scaled up, and how far the cursor is when the eyes reach it. */
const LOOK_PX = 4;
const FULL_LOOK_DISTANCE_PX = 420;
/** Glances wait until the cursor has been still this long. */
const CURSOR_IDLE_MS = 2200;
/** Time between the little things it does on its own. */
const IDLE_MIN_MS = 900;
const IDLE_SPREAD_MS = 1500;

const TRICKS: { act: Act; weight: number; line?: string }[] = [
  { act: "hop", weight: 16 },
  { act: "wiggle", weight: 12 },
  { act: "nod", weight: 10 },
  { act: "bounce", weight: 10 },
  { act: "squish", weight: 10 },
  { act: "spin", weight: 6, line: "Wheee!" },
  { act: "shake", weight: 5, line: "Brrr!" },
];

const POKES: { line: string; act: Act }[] = [
  { line: "Hehe!", act: "squish" },
  { line: "That tickles!", act: "wiggle" },
  { line: "Whoa, careful!", act: "shake" },
  { line: "Boop!", act: "bounce" },
  { line: "Still on it, promise.", act: "nod" },
  { line: "Okay, okay, almost there!", act: "spin" },
];

function pickTrick(previous: Act | null) {
  const pool = TRICKS.filter((t) => t.act !== previous);
  let roll = Math.random() * pool.reduce((sum, t) => sum + t.weight, 0);
  for (const trick of pool) {
    roll -= trick.weight;
    if (roll <= 0) return trick;
  }
  return pool[0];
}

export default function MaintenanceView() {
  const stage = useRef<HTMLButtonElement>(null);
  const act = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);
  const lastPointerAt = useRef(0);
  const lastGreetAt = useRef(0);
  const lastAct = useRef<Act | null>(null);
  const pokes = useRef(0);
  const sayTimer = useRef(0);
  const [line, setLine] = useState(0);
  const [said, setSaid] = useState<string | null>(null);

  const perform = useCallback((kind: Act) => {
    const el = act.current;
    if (!el || reduced.current) return;
    lastAct.current = kind;
    el.removeAttribute("data-lynx-act");
    void el.offsetWidth; // restart the animation if the same move plays twice in a row
    el.setAttribute("data-lynx-act", kind);
  }, []);

  /** A word in the bubble that replaces the cycling lines for a moment. */
  const say = useCallback((text: string, ms = 2000) => {
    window.clearTimeout(sayTimer.current);
    setSaid(text);
    sayTimer.current = window.setTimeout(() => setSaid(null), ms);
  }, []);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => window.clearTimeout(sayTimer.current);
  }, []);

  // The bubble cycles through its lines (it stays on the first line for reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setLine((i) => (i + 1) % LINES.length), LINE_MS);
    return () => window.clearInterval(id);
  }, []);

  // The eyes follow the cursor. Two CSS variables, so nothing re-renders on each mouse move.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const apply = () => {
      frame = 0;
      if (!pointer) return;
      const rect = el.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(distance / FULL_LOOK_DISTANCE_PX, 1) * LOOK_PX;
      el.style.setProperty("--mascot-look-x", `${((dx / distance) * reach).toFixed(2)}px`);
      el.style.setProperty("--mascot-look-y", `${((dy / distance) * reach).toFixed(2)}px`);
    };
    const onMove = (event: PointerEvent) => {
      lastPointerAt.current = performance.now();
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Things it does on its own, every second or two.
  useEffect(() => {
    const stageEl = stage.current;
    const actEl = act.current;
    if (!stageEl || !actEl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const done = () => actEl.removeAttribute("data-lynx-act");
    actEl.addEventListener("animationend", done);

    const glance = () => {
      const angle = Math.random() * Math.PI * 2;
      stageEl.style.setProperty("--mascot-look-x", `${(Math.cos(angle) * LOOK_PX).toFixed(2)}px`);
      stageEl.style.setProperty("--mascot-look-y", `${(Math.sin(angle) * LOOK_PX).toFixed(2)}px`);
      later(() => {
        stageEl.style.removeProperty("--mascot-look-x");
        stageEl.style.removeProperty("--mascot-look-y");
      }, 700 + Math.random() * 600);
    };

    const tick = () => {
      if (document.visibilityState !== "visible" || actEl.hasAttribute("data-lynx-act")) return; // one move at a time
      if (Math.random() < 0.3) {
        if (performance.now() - lastPointerAt.current > CURSOR_IDLE_MS) glance();
        return;
      }
      const trick = pickTrick(lastAct.current);
      perform(trick.act);
      if (trick.line) say(trick.line, 1500);
    };
    const loop = () =>
      later(() => {
        tick();
        loop();
      }, IDLE_MIN_MS + Math.random() * IDLE_SPREAD_MS);
    loop();

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      actEl.removeEventListener("animationend", done);
    };
  }, [perform, say]);

  // Send visitors back the moment the site is up again, and welcome them back to the tab.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("preview")) return;
    let finished = false;
    const check = async () => {
      try {
        const res = await fetch("/api/maintenance", { cache: "no-store" });
        const data = (await res.json()) as { maintenance?: boolean };
        if (finished || data.maintenance !== false) return;
        finished = true;
        say("We're back! Let's go…", 4000);
        perform("spin");
        window.setTimeout(() => window.location.replace("/"), 1600);
      } catch {
        // offline or the server is restarting: try again on the next tick
      }
    };
    const id = window.setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      say("You're back!", 1800);
      perform("hop");
      void check();
    };
    const onOnline = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      finished = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [perform, say]);

  const poke = () => {
    const reaction = POKES[pokes.current++ % POKES.length];
    perform(reaction.act);
    say(reaction.line, 1800);
  };

  const greet = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse" || performance.now() - lastGreetAt.current < 6000) return;
    lastGreetAt.current = performance.now();
    perform("nod");
    say("Hi there!", 1600);
  };

  const text = said ?? LINES[line];

  return (
    <main className="flex min-h-screen flex-1 flex-col px-4 pb-6 pt-6 text-center sm:px-6 sm:pb-8 sm:pt-8">
      {/* Who this is: the site's own wordmark and what it is */}
      <header className="mx-auto w-full max-w-3xl">
        <div className="relative aspect-[2144/275] w-full">
          <Image
            src="/images/uoc-alumni-wordmark.png"
            alt="UOC Alumni"
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-contain"
            priority
          />
        </div>
        <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-[#121212] sm:mt-4 sm:gap-3 sm:text-xs">
          <span aria-hidden="true" className="font-semibold tracking-[2px]">
            ooo
          </span>
          <div aria-hidden="true" className="flex-1 border-b border-dashed border-[#121212]" />
          <span className="font-semibold uppercase tracking-wider">Official website of the Leo Club of UOC Alumni</span>
          <div aria-hidden="true" className="flex-1 border-b border-dashed border-[#121212]" />
          <span aria-hidden="true" className="font-semibold tracking-[2px]">
            ooo
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <div className="flex flex-col items-center">
          {/* Speech bubble (decorative: the heading below says the same thing) */}
          <div
            aria-hidden="true"
            className="relative mb-8 min-w-44 max-w-[85vw] bg-[#121212] px-5 py-3 font-mono text-sm font-semibold text-white after:absolute after:-bottom-1.5 after:left-1/2 after:size-3 after:-translate-x-1/2 after:rotate-45 after:bg-[#121212] sm:mb-10 sm:px-6 sm:py-3.5 sm:text-base"
          >
            <span
              key={text}
              className="block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
            >
              {text}
            </span>
          </div>

          {/* LYNX, as a button so it can be poked (and reached by keyboard). The moves play on the outer wrapper, which is not
              scaled; --lynx-amp scales their distances to match how big the mascot is drawn. */}
          <button
            ref={stage}
            type="button"
            onClick={poke}
            onPointerEnter={greet}
            aria-label="Poke LYNX"
            className="group grid size-40 cursor-pointer place-items-center outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#121212] sm:size-44"
          >
            <div ref={act} className="[--lynx-amp:2.6] sm:[--lynx-amp:3]">
              <div className="scale-[3.6] transition-[scale] duration-300 ease-[cubic-bezier(.22,1.5,.5,1)] group-hover:scale-[3.85] group-active:scale-[3.3] motion-reduce:transition-none sm:scale-[4] sm:group-hover:scale-[4.25] sm:group-active:scale-[3.65]">
                <AIMascot />
              </div>
            </div>
          </button>
          <div aria-hidden="true" className="mt-3 h-2 w-24 rounded-full bg-[#121212]/15 blur-md sm:mt-4 sm:w-28" />
        </div>

        <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-balance text-[#121212] sm:text-5xl">
          We&rsquo;ll be right back.
        </h1>
        <p className="mt-3 max-w-md font-sans text-base leading-relaxed text-[#444]">
          The UOCA website is getting some care and attention. Wait right here with LYNX; this page opens the site again the moment
          we&rsquo;re back.
        </p>

        <p role="status" className="mt-6 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#555]">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#ef671c] motion-safe:animate-pulse" />
          Checking every {POLL_MS / 1000} seconds. No need to refresh.
        </p>
      </div>

      <footer className="font-mono text-[11px] uppercase tracking-wider text-[#555]">
        Powered by <span className="font-bold text-[#121212]">Dandy Studios</span>
      </footer>
    </main>
  );
}
