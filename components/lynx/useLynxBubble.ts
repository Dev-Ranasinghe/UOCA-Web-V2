"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The little speech bubbles LYNX pops up from the corner. They are invitations only ("Holaaa!", "Ask me about our
 * projects!"): they never state facts about UOCA, so there is nothing here to go out of date.
 */

const GREETINGS = ["Holaaa!", "Hi, LYNX is here!"];

const GENERAL = [
  "Psst… got a question about UOCA?",
  "Need a hand exploring the club?",
  "Ask me about our projects!",
  "Curious what's coming up? Ask me!",
  "Thinking of joining? I can help.",
  "New here? Let me show you around.",
  "Say hi to LYNX!",
  "I'm just a tap away.",
  "Hola! Need anything?",
  "Wondering about UOCA? Ask away.",
];

/** Extra lines for the page you're on. */
const BY_PAGE: [prefix: string, lines: string[]][] = [
  ["/projects", ["Want the story behind a project? Ask me!", "Which project should we look at first?"]],
  ["/team", ["Wondering who's who? Ask me.", "Want to know who leads what?"]],
  ["/blog", ["Missed a meeting? I can catch you up.", "Looking for a particular article? Ask me."]],
  ["/join", ["Questions before you apply? Ask away.", "Need help with the application? I'm here."]],
  ["/contact", ["Can't find what you need? Try me."]],
  ["/calendar", ["Looking for events? Ask me!"]],
  ["/leo-id", ["Looking for a Leo? I can help find them."]],
  ["/subscribe", ["Want to know what's new? Ask me."]],
];

const ENGAGED_KEY = "lynx:engaged";
const SHOWN_FOR_MS = 4800;
const LEAVE_MS = 220;

function readEngaged(): boolean {
  try {
    return sessionStorage.getItem(ENGAGED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Once someone has opened the chat, LYNX stops nudging for the rest of the visit. */
export function markLynxEngaged() {
  try {
    sessionStorage.setItem(ENGAGED_KEY, "1");
  } catch {
    // Private mode: it just won't remember.
  }
}

export type LynxBubble = { id: number; text: string; leaving: boolean };

export function useLynxBubble({ suspended, pathname }: { suspended: boolean; pathname: string }) {
  const [bubble, setBubble] = useState<LynxBubble | null>(null);
  const timers = useRef<number[]>([]);
  const counter = useRef(0);
  const last = useRef("");

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const hide = useCallback(() => {
    setBubble((current) => (current ? { ...current, leaving: true } : current));
    timers.current.push(window.setTimeout(() => setBubble(null), LEAVE_MS));
  }, []);

  useEffect(() => {
    // Nothing while the chat is open, on LYNX's own page, or once the visitor has already found the chat.
    if (suspended || pathname.startsWith("/lynx") || readEngaged()) {
      clearTimers();
      const reset = window.setTimeout(() => setBubble(null), 0);
      return () => window.clearTimeout(reset);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxBubbles = reduced ? 3 : 14;
    const pageLines = BY_PAGE.filter(([prefix]) => pathname.startsWith(prefix)).flatMap(([, lines]) => lines);

    const pick = () => {
      if (counter.current < GREETINGS.length) return GREETINGS[counter.current];
      const pool = [...GENERAL, ...pageLines, ...pageLines].filter((line) => line !== last.current);
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const typing = () => {
      const el = document.activeElement;
      return el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
    };

    const schedule = (delay: number) => {
      timers.current.push(
        window.setTimeout(() => {
          if (counter.current >= maxBubbles) return;
          // Don't pop up while the tab is in the background or someone is filling in a form.
          if (document.visibilityState !== "visible" || typing()) {
            schedule(8000);
            return;
          }
          const text = pick();
          last.current = text;
          counter.current += 1;
          setBubble({ id: counter.current, text, leaving: false });
          timers.current.push(window.setTimeout(hide, SHOWN_FOR_MS));
          schedule(reduced ? 45_000 : 11_000 + Math.random() * 11_000);
        }, delay),
      );
    };

    schedule(counter.current === 0 ? 3500 : 12_000);
    return clearTimers;
  }, [suspended, pathname, clearTimers, hide]);

  return { bubble, hide };
}
