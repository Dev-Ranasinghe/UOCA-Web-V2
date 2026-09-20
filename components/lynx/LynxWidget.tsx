"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, RotateCcw, Square, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AIMascot, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/ask-ai";
import { LYNX_GREETING, LYNX_MAX_MESSAGE_CHARS, LYNX_SUGGESTIONS } from "@/lib/lynx/config";
import { cn } from "@/lib/utils";
import { LynxLauncher } from "./LynxLauncher";
import Markdown from "./Markdown";
import { markLynxEngaged, useLynxBubble } from "./useLynxBubble";
import { useLynxChat, type ChatMessage } from "./useLynxChat";

/**
 * LYNX, the UOCA AI assistant: a floating launcher in the bottom-right corner that opens a chat panel.
 * Anywhere on the site can open it with `window.dispatchEvent(new CustomEvent("lynx:open", { detail: { prompt } }))`.
 */

const COUNTER_FROM = Math.floor(LYNX_MAX_MESSAGE_CHARS * 0.8);

function TypingDots() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="lynx-dot size-1.5 rounded-full bg-[#121212]"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center">
        <AIMascot size="compact" />
      </span>
      {children}
    </div>
  );
}

const messageBubble = "min-w-0 max-w-[calc(100%-2.25rem)] rounded-lg px-3.5 py-2.5 font-sans text-[15px] leading-relaxed text-[#121212]";

function MessageView({
  message,
  isLast,
  phase,
  statusText,
  onRetry,
  onNavigate,
}: {
  message: ChatMessage;
  isLast: boolean;
  phase: string;
  statusText: string;
  onRetry: () => void;
  onNavigate: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-[#121212] px-3.5 py-2.5 font-sans text-[15px] leading-relaxed text-white">
          {message.content}
        </p>
      </div>
    );
  }

  if (message.error) {
    return (
      <AssistantRow>
        <div className={cn(messageBubble, "border border-[#b3261e] bg-white")} role="alert">
          <p>{message.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#121212] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-[#f3c276] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
          >
            <RotateCcw aria-hidden="true" className="size-3" />
            Retry
          </button>
        </div>
      </AssistantRow>
    );
  }

  if (!message.content) {
    // Waiting for the first words: show that LYNX is working, and on what.
    return isLast && phase !== "idle" ? (
      <AssistantRow>
        <div className={cn(messageBubble, "flex items-center gap-2.5 bg-[#eae7e1]")}>
          <TypingDots />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#555]" aria-live="polite">
            {statusText || "Thinking…"}
          </span>
        </div>
      </AssistantRow>
    ) : null;
  }

  return (
    <AssistantRow>
      <div className={cn(messageBubble, "bg-[#eae7e1]")}>
        <Markdown text={message.content} knownLinks={message.links} onNavigate={onNavigate} />
      </div>
    </AssistantRow>
  );
}

export default function LynxWidget() {
  const chat = useLynxChat();
  const { messages, phase, statusText, busy } = chat;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const pathname = usePathname() ?? "/";
  const { bubble, hide: hideBubble } = useLynxBubble({ suspended: open, pathname });

  // Once someone has opened the chat, LYNX stops popping up speech bubbles for the rest of the visit.
  useEffect(() => {
    if (open) markLynxEngaged();
  }, [open]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** Follow new text as it streams, unless the visitor has scrolled up to read something earlier. */
  const stickToBottom = useRef(true);

  const { send } = chat;

  // Other parts of the site (the /lynx page) can open LYNX, optionally with a question already asked.
  useEffect(() => {
    const onOpen = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setOpen(true);
      if (prompt) {
        stickToBottom.current = true;
        send(prompt);
      }
    };
    window.addEventListener("lynx:open", onOpen);
    return () => window.removeEventListener("lynx:open", onOpen);
  }, [send]);

  // Keep the newest words in view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, phase, open]);

  // Grow the input with its text, up to about four lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [draft, open]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      stickToBottom.current = true;
      send(value);
      setDraft("");
    },
    [busy, send],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a line. Ignore Enter while an input method (for example Sinhala or Japanese) is composing.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  };

  /** The page behind the chat is frosted, so after following a link the chat steps aside to let you see where you landed.
      The conversation is kept: opening LYNX again picks up where you left off. */
  const onNavigate = () => setOpen(false);

  const remaining = LYNX_MAX_MESSAGE_CHARS - draft.length;
  const empty = messages.length === 0;

  return (
    <TooltipProvider delayDuration={250}>
      <div className="fixed bottom-2 right-2 z-[60] sm:bottom-4 sm:right-4">
        {/* A speech bubble that pops up now and then. Decorative: the button below is the accessible way in. */}
        {bubble ? (
          <button
            key={bubble.id}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-leaving={bubble.leaving}
            onClick={() => {
              hideBubble();
              setOpen(true);
            }}
            className="lynx-bubble absolute right-full top-1/2 mr-3 w-max max-w-[min(15rem,calc(100vw-7.5rem))] -translate-y-1/2 cursor-pointer rounded-lg bg-[#121212] px-3.5 py-2.5 text-left font-sans text-sm font-medium leading-snug text-white shadow-[0_10px_20px_-8px_rgba(0,0,0,0.35)]"
          >
            {bubble.text}
            <span aria-hidden="true" className="absolute -right-1 top-1/2 size-2.5 -translate-y-1/2 rotate-45 rounded-[2px] bg-[#121212]" />
          </button>
        ) : null}

        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <Tooltip
            open={open || bubble ? false : tooltipOpen}
            onOpenChange={(next) => setTooltipOpen(open || bubble ? false : next)}
          >
            <TooltipTrigger asChild>
              <DialogPrimitive.Trigger asChild>
                <LynxLauncher open={open} nudge={bubble?.id ?? 0} />
              </DialogPrimitive.Trigger>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-mono text-[11px] uppercase tracking-wider">
              Ask LYNX
            </TooltipContent>
          </Tooltip>

          <DialogPrimitive.Portal>
            {/* The frost: the whole page behind the chat is blurred and lightly tinted, and can't be used until the chat is closed.
                It sweeps in and out like the page-change curtain (opens bottom to top and closes top to bottom on phones and tablets; opens right to left and closes left to right on desktop) (see .lynx-frost in globals.css). */}
            <DialogPrimitive.Overlay className="lynx-frost fixed inset-0 z-[70] bg-[#eae7e1]/45 backdrop-blur-xl backdrop-saturate-150" />

            <DialogPrimitive.Content
              // The chat only closes from its own controls (the X, or Esc), never by clicking the frosted page.
              onPointerDownOutside={(event) => event.preventDefault()}
              onInteractOutside={(event) => event.preventDefault()}
              // With a mouse, put the cursor straight in the box. On a touch screen that would raise the keyboard over
              // the suggestions, so leave focus on the first control instead.
              onOpenAutoFocus={(event) => {
                if (window.matchMedia("(pointer: coarse)").matches) return;
                event.preventDefault();
                inputRef.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                document.querySelector<HTMLElement>("[data-lynx-launcher]")?.focus();
              }}
              className={cn(
                "fixed z-[71] flex flex-col overflow-hidden rounded-sm border-2 border-dashed border-[#121212] bg-white text-[#121212] outline-none",
                "shadow-[0_28px_60px_-18px_rgba(0,0,0,0.45)] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none",
                // Phone: a sheet rising from the bottom, about four fifths of the screen, leaving a band of frosted page above it.
                "inset-x-2 bottom-2 h-[min(80dvh,42rem)]",
                // Tablet and desktop: a card on the right, about a third of the screen wide and nearly full height.
                "sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:h-auto sm:w-[clamp(24rem,33.333vw,34rem)]",
                // The card arrives once the frost has started to fall (a short delay, hidden until then).
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-10 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:slide-in-from-right-10 data-[state=open]:[animation-delay:250ms] data-[state=open]:[animation-fill-mode:backwards]",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-10 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:slide-out-to-right-10",
              )}
            >
              <DialogPrimitive.Description className="sr-only">
                Ask LYNX questions about UOCA&apos;s projects, events, team and how to join. Close the chat to return to the website.
              </DialogPrimitive.Description>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#121212] px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f3c276]">
                <AIMascot size="compact" awake={busy} gaze="down" />
              </span>
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="font-serif text-xl font-bold leading-none">LYNX</DialogPrimitive.Title>
                <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[2px] text-[#555]">UOCA AI Assistant</p>
              </div>
              <button
                type="button"
                onClick={chat.clear}
                disabled={empty}
                aria-label="Start a new conversation"
                title="New conversation"
                className="grid size-9 place-items-center rounded-full text-[#121212] transition-colors hover:bg-[#f3c276] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] disabled:pointer-events-none disabled:opacity-30"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close LYNX"
                className="grid size-9 place-items-center rounded-full text-[#121212] transition-colors hover:bg-[#f3c276] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            {/* The site's dotted-line motif, saying where answers come from. */}
            <div className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] font-semibold tracking-[2px] text-[#121212]">
              <span aria-hidden="true">ooo</span>
              <span aria-hidden="true" className="flex-1 border-b border-dashed border-[#121212]" />
              <span>[LIVE UOCA DATA]</span>
            </div>

            {/* Conversation */}
            <div
              ref={scrollRef}
              onScroll={onScroll}
              role="log"
              aria-label="Conversation with LYNX"
              aria-busy={busy}
              tabIndex={0}
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-4 pt-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#121212]"
            >
              {empty ? (
                <>
                  <AssistantRow>
                    <p className={cn(messageBubble, "bg-[#eae7e1]")}>{LYNX_GREETING}</p>
                  </AssistantRow>
                  <div className="flex flex-wrap gap-2 pl-[2.375rem]">
                    {LYNX_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => submit(suggestion)}
                        className="rounded-full border border-[#121212] bg-white px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-[#f3c276] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                messages.map((message, index) => (
                  <MessageView
                    key={message.id}
                    message={message}
                    isLast={index === messages.length - 1}
                    phase={phase}
                    statusText={statusText}
                    onRetry={chat.retry}
                    onNavigate={onNavigate}
                  />
                ))
              )}
            </div>

            {/* Composer */}
            <form onSubmit={onSubmit} className="border-t border-[#121212] px-3 pb-2 pt-3">
              <div className="flex items-end gap-2 rounded-lg border border-[#767676] bg-white py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-[#121212]">
                <label htmlFor="lynx-input" className="sr-only">
                  Ask LYNX a question about UOCA
                </label>
                <textarea
                  id="lynx-input"
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  maxLength={LYNX_MAX_MESSAGE_CHARS}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask LYNX something…"
                  className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 font-sans text-base leading-snug text-[#121212] caret-[#121212] outline-none placeholder:text-[#767676] selection:bg-[#f3c276] sm:text-[15px]"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={chat.stop}
                    aria-label="Stop answering"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-[#121212] text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
                  >
                    <Square aria-hidden="true" className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    aria-label="Send message"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-[#121212] text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] disabled:cursor-not-allowed disabled:bg-[#767676]"
                  >
                    <ArrowUp aria-hidden="true" className="size-[18px]" strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-start justify-between gap-3 px-1">
                <p className="font-sans text-[11px] leading-snug text-[#555]">
                  LYNX answers from live UOCA data and can make mistakes. Check the linked pages.
                </p>
                {draft.length >= COUNTER_FROM ? (
                  <span
                    className={cn("shrink-0 font-mono text-[11px] tabular-nums", remaining <= 20 ? "font-bold text-[#b3261e]" : "text-[#555]")}
                    aria-live="polite"
                  >
                    {remaining}
                  </span>
                ) : null}
              </div>
            </form>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </TooltipProvider>
  );
}
