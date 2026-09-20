/**
 * LYNX settings that both the browser and the server need. Nothing secret lives here: no keys, no database code.
 */

/** Longest question a visitor can send. The chat box counts down to it. */
export const LYNX_MAX_MESSAGE_CHARS = 500;

/** How many earlier messages are sent along so follow-ups like "who is leading it?" make sense. */
export const LYNX_HISTORY_MESSAGES = 8;

/** Pages LYNX may always link to. Project and article links are only trusted if they came from the database this turn. */
export const LYNX_STATIC_PAGES = [
  "/",
  "/projects",
  "/blog",
  "/team",
  "/join",
  "/contact",
  "/subscribe",
  "/leo-id",
  "/lynx",
  "/calendar",
  "/newsletter",
] as const;

export const LYNX_GREETING = "Hey! I'm LYNX 👋 How can I help you explore UOCA?";

export const LYNX_SUGGESTIONS = [
  "Explore our projects",
  "Upcoming events",
  "How can I join UOCA?",
  "Tell me about UOCA",
] as const;

/** Shown to visitors when a question is off topic. Also what the model is told to say. */
export const LYNX_REDIRECT_MESSAGE =
  "I'm LYNX, the UOCA AI Assistant. I can help you with UOCA's projects, events, membership, activities and other club-related information. 🐘";

export const LYNX_ERRORS = {
  model: "I'm having trouble connecting right now. Please try again in a moment.",
  data: "I'm unable to access the latest UOCA information right now. Please try again shortly.",
  rateLimited: "You're asking a lot in a short time. Please give me a minute and try again.",
  invalid: "I couldn't read that message. Please try rephrasing your question.",
} as const;

/** What the server streams to the browser, one JSON object per line. */
export type LynxStreamEvent =
  | { t: "status"; d: string }
  | { t: "links"; d: string[] }
  | { t: "text"; d: string }
  | { t: "done" }
  | { t: "error"; d: string; retry?: boolean };

export type LynxRole = "user" | "assistant";
export type LynxMessage = { role: LynxRole; content: string };
