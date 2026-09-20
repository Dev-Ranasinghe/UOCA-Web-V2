"use client";

// Adapted from Hyperiux Vault's "immersive full screen nav" (https://vault.hyperiux.com).
// The clip-path wipe, focus trap and reduced-motion handling are kept; the fixed brand/hamburger
// header is not, because the site's own header stays on screen and drives this panel via `open`.

import gsap from "gsap";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/* ------------------------------------------------------------------ *
 * useFocusTrap — keeps keyboard focus inside a container while it's open
 * and restores it to the trigger on close.
 * ------------------------------------------------------------------ */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const isVisible = (element?: HTMLElement | null): boolean => {
  if (!element || element.hidden) return false;
  const style = window.getComputedStyle(element);
  if (style.visibility === "hidden" || style.visibility === "collapse") return false;
  return element.getClientRects().length > 0;
};

const getFocusableElements = (container?: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];
  return (Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]).filter(isVisible);
};

interface UseFocusTrapParams {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onEscape?: () => void;
}

/**
 * Keeps keyboard focus inside `containerRef` while `active` is true.
 * Captures the previously focused element and restores it on close, moves focus in on open,
 * wraps Tab / Shift+Tab, and calls `onEscape` on Escape.
 */
function useFocusTrap({ active, containerRef, initialFocusRef, onEscape }: UseFocusTrapParams) {
  const onEscapeRef = useRef(onEscape);
  // Keep the latest handler without touching the ref during render.
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      const target = initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container;
      if (!(target instanceof HTMLElement)) return;
      if (target === container && !container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }
      target.focus();
    };

    // Defer focus so it lands after the panel has started to reveal.
    const focusFrame = requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(container);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !container.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last || !container.contains(activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocusRef]);
}

/* ------------------------------------------------------------------ *
 * ImmersiveNavPanel — a fixed full-screen panel that wipes open from an edge via clip-path.
 * ------------------------------------------------------------------ */

const CLIPS = {
  bottom: {
    closedInitial: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
    open: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    closedFinal: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  },
  top: {
    closedInitial: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    open: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    closedFinal: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
  },
  left: {
    closedInitial: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
    open: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    closedFinal: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
  },
  right: {
    closedInitial: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
    open: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    closedFinal: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
  },
};

const REDUCED_MOTION_FADE_DURATION = 0.2;

export type ImmersiveNavClipOrigin = keyof typeof CLIPS;

export interface ImmersiveNavPanelProps {
  open: boolean;
  onClose: () => void;
  id?: string;
  /** Edge the panel wipes in from. */
  clipOrigin?: ImmersiveNavClipOrigin;
  overlayBg?: string;
  openDuration?: number;
  closeDuration?: number;
  ease?: string;
  className?: string;
  /** Focused first when the panel opens (defaults to its first focusable element). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: (isOpen: boolean) => ReactNode;
}

export function ImmersiveNavPanel({
  open,
  onClose,
  id,
  clipOrigin = "top",
  overlayBg = "#000000",
  openDuration = 0.9,
  closeDuration = 0.8,
  ease = "power4.inOut",
  className = "",
  initialFocusRef,
  children,
}: ImmersiveNavPanelProps) {
  const overlayRef = useRef<HTMLElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const wasOpen = useRef(false);
  const { closedInitial, open: openClip, closedFinal } = CLIPS[clipOrigin] ?? CLIPS.top;

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || open === wasOpen.current) return;
    wasOpen.current = open;
    tweenRef.current?.kill();

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    const hide = () => gsap.set(overlay, { clipPath: closedInitial, opacity: 1, visibility: "hidden" });

    if (open) {
      gsap.set(overlay, { visibility: "visible" });
      if (reduced) {
        gsap.set(overlay, { clipPath: openClip, opacity: 0 });
        tweenRef.current = gsap.to(overlay, { opacity: 1, duration: REDUCED_MOTION_FADE_DURATION, ease: "power2.out" });
        return;
      }
      gsap.set(overlay, { clipPath: closedInitial });
      tweenRef.current = gsap.to(overlay, { clipPath: openClip, duration: openDuration, ease });
      return;
    }

    if (reduced) {
      tweenRef.current = gsap.to(overlay, {
        opacity: 0,
        duration: REDUCED_MOTION_FADE_DURATION,
        ease: "power2.out",
        onComplete: hide,
      });
      return;
    }
    tweenRef.current = gsap.to(overlay, { clipPath: closedFinal, duration: closeDuration, ease, onComplete: hide });
  }, [open, closedInitial, openClip, closedFinal, openDuration, closeDuration, ease]);

  useEffect(() => () => void tweenRef.current?.kill(), []);

  // Lock page scroll while the panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useFocusTrap({ active: open, containerRef: overlayRef, initialFocusRef, onEscape: onClose });

  return (
    <nav
      ref={overlayRef}
      id={id}
      aria-label="Main menu"
      aria-hidden={!open}
      style={{ clipPath: closedInitial, backgroundColor: overlayBg, visibility: "hidden" }}
      className={`fixed inset-0 overflow-y-auto overscroll-contain ${open ? "pointer-events-auto" : "pointer-events-none"} ${className}`}
    >
      {children(open)}
    </nav>
  );
}

export default ImmersiveNavPanel;
