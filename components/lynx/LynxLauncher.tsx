"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, type ButtonHTMLAttributes, type RefObject } from "react";
import { AIMascot } from "@/components/ui/ask-ai";
import { cn } from "@/lib/utils";

/**
 * The floating LYNX button: the black-and-white blinking mascot from the Ask AI component, always in the bottom-right
 * corner. It has a bit of life while it waits: its eyes follow the cursor, and every few seconds it glances around,
 * hops or wiggles. When a speech bubble pops up (see useLynxBubble) it perks up with a hop and glances toward it.
 * Everything stays still while the chat is open, and for visitors who have asked for reduced motion.
 */

/** How far the eyes travel, in px (before the mascot is scaled up). */
const MAX_LOOK_PX = 4;
/** The eyes reach full travel toward the cursor when it is about this far away. */
const FULL_LOOK_DISTANCE_PX = 360;
/** After the cursor has been still this long, the mascot may look around on its own. */
const CURSOR_IDLE_MS = 2500;

type Act = "hop" | "wiggle";

function useMascotLife({
  button,
  act,
  paused,
  nudge,
}: {
  button: RefObject<HTMLElement | null>;
  act: RefObject<HTMLElement | null>;
  paused: boolean;
  nudge: number;
}) {
  const lastPointerAt = useRef(0);

  // 1. The eyes follow the cursor, by setting two CSS variables (so there is no re-render on each mouse move).
  useEffect(() => {
    const el = button.current;
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
      const reach = Math.min(distance / FULL_LOOK_DISTANCE_PX, 1) * MAX_LOOK_PX;
      el.style.setProperty("--mascot-look-x", `${((dx / distance) * reach).toFixed(2)}px`);
      el.style.setProperty("--mascot-look-y", `${((dy / distance) * reach).toFixed(2)}px`);
    };

    const onMove = (event: PointerEvent) => {
      lastPointerAt.current = performance.now();
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };
    // When the cursor leaves the window the eyes settle back to the middle.
    const onLeave = () => {
      pointer = null;
      el.style.removeProperty("--mascot-look-x");
      el.style.removeProperty("--mascot-look-y");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [button]);

  // 2. Idle behaviour: every few seconds it glances somewhere, hops or wiggles.
  useEffect(() => {
    const el = button.current;
    const actEl = act.current;
    if (!el || !actEl || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));

    const look = (x: number, y: number, forMs: number) => {
      el.style.setProperty("--mascot-look-x", `${x}px`);
      el.style.setProperty("--mascot-look-y", `${y}px`);
      later(() => {
        // Only settle back if the cursor hasn't taken over in the meantime.
        if (performance.now() - lastPointerAt.current > forMs) {
          el.style.removeProperty("--mascot-look-x");
          el.style.removeProperty("--mascot-look-y");
        }
      }, forMs);
    };

    const perform = (kind: Act) => {
      actEl.removeAttribute("data-lynx-act");
      void actEl.offsetWidth; // restart the animation if the same one plays twice in a row
      actEl.setAttribute("data-lynx-act", kind);
    };
    const done = () => actEl.removeAttribute("data-lynx-act");
    actEl.addEventListener("animationend", done);

    const idle = () => {
      if (document.visibilityState !== "visible") return;
      const roll = Math.random();
      if (roll < 0.5) {
        if (performance.now() - lastPointerAt.current < CURSOR_IDLE_MS) return;
        const angle = Math.random() * Math.PI * 2;
        look(Math.cos(angle) * MAX_LOOK_PX, Math.sin(angle) * MAX_LOOK_PX, 700 + Math.random() * 500);
      } else if (roll < 0.78) {
        perform("hop");
      } else {
        perform("wiggle");
      }
    };

    const loop = () => {
      later(() => {
        idle();
        loop();
      }, 2200 + Math.random() * 3400);
    };
    loop();

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      actEl.removeEventListener("animationend", done);
    };
  }, [button, act, paused]);

  // 3. A speech bubble appeared: perk up and glance toward it (it sits to the left).
  useEffect(() => {
    const el = button.current;
    const actEl = act.current;
    if (!nudge || paused || !el || !actEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    actEl.removeAttribute("data-lynx-act");
    void actEl.offsetWidth;
    actEl.setAttribute("data-lynx-act", "hop");
    el.style.setProperty("--mascot-look-x", `${-MAX_LOOK_PX}px`);
    el.style.setProperty("--mascot-look-y", "0px");
    const t = window.setTimeout(() => {
      if (performance.now() - lastPointerAt.current > 1400) {
        el.style.removeProperty("--mascot-look-x");
        el.style.removeProperty("--mascot-look-y");
      }
    }, 1400);
    return () => window.clearTimeout(t);
  }, [nudge, paused, button, act]);
}

type LauncherProps = { open: boolean; nudge?: number } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export const LynxLauncher = forwardRef<HTMLButtonElement, LauncherProps>(function LynxLauncher(
  { open, nudge = 0, className, ...props },
  ref,
) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const actRef = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);
  useMascotLife({ button: buttonRef, act: actRef, paused: open, nudge });

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={open ? "Close LYNX, the UOCA AI assistant" : "Open LYNX, the UOCA AI assistant"}
      aria-expanded={open}
      data-lynx-launcher=""
      className={cn(
        "group relative grid size-[4.5rem] cursor-pointer place-items-center rounded-full transition-transform duration-200 sm:size-20",
        "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#121212]",
        className,
      )}
      {...props}
    >
      {/* The hop and wiggle play on this wrapper, so they don't fight the scale below. */}
      <span ref={actRef} className="block">
        {/* The cream rim keeps the black shape visible when the page scrolls onto the black footer. Both the rim and
            the shadow sit on the blob itself, so they follow its shape as it slowly morphs. */}
        <span className="block scale-[1.65] sm:scale-[1.85]">
          <AIMascot
            awake={open}
            gaze="up"
            className="shadow-[0_0_0_1.5px_#eae7e1,0_8px_14px_-4px_rgba(0,0,0,0.35)]"
          />
        </span>
      </span>
    </button>
  );
});
