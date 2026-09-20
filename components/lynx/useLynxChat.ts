"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LYNX_ERRORS,
  LYNX_HISTORY_MESSAGES,
  LYNX_MAX_MESSAGE_CHARS,
  type LynxStreamEvent,
} from "@/lib/lynx/config";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Website paths LYNX was given by the database for this answer. Only these can become links. */
  links: string[];
  /** Set when the answer failed. The message stays in the list so it can be retried. */
  error?: string;
};

export type ChatPhase = "idle" | "thinking" | "streaming";

/** Drops failed or stopped turns (the errored answer and the question that caused it) so they aren't sent as context. */
function withoutFailedTurns(messages: ChatMessage[]): ChatMessage[] {
  const kept: ChatMessage[] = [];
  for (const m of messages) {
    if (m.role === "assistant" && m.error) {
      if (kept[kept.length - 1]?.role === "user") kept.pop();
      continue;
    }
    kept.push(m);
  }
  return kept;
}

let counter = 0;
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

/**
 * Talks to /api/lynx and keeps the conversation in memory. The conversation lives only in this tab: nothing is
 * saved to storage or sent anywhere except the questions themselves, which the server doesn't keep either.
 */
export function useLynxChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const [statusText, setStatusText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Leaving the page mid-answer shouldn't leave a request running.
  useEffect(() => () => abortRef.current?.abort(), []);

  const patch = useCallback((id: string, change: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? change(m) : m)));
  }, []);

  /** Sends `text` as the next question. `history` is the conversation before it. */
  const ask = useCallback(
    async (text: string, history: ChatMessage[]) => {
      const question = text.trim().slice(0, LYNX_MAX_MESSAGE_CHARS);
      if (!question) return;

      const userMessage: ChatMessage = { id: nextId(), role: "user", content: question, links: [] };
      const reply: ChatMessage = { id: nextId(), role: "assistant", content: "", links: [] };
      setMessages([...history, userMessage, reply]);
      setPhase("thinking");
      setStatusText("");

      const controller = new AbortController();
      abortRef.current = controller;

      // Only finished, successful turns are sent back as context.
      const context = [...history, userMessage]
        .filter((m) => m.content && !m.error)
        .slice(-LYNX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      const fail = (message: string) => patch(reply.id, (m) => ({ ...m, error: message }));

      try {
        const response = await fetch("/api/lynx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: context }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          fail(body?.error || LYNX_ERRORS.model);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawDone = false;

        const handle = (event: LynxStreamEvent) => {
          switch (event.t) {
            case "status":
              setStatusText(event.d);
              break;
            case "links":
              patch(reply.id, (m) => ({ ...m, links: event.d }));
              break;
            case "text":
              setPhase("streaming");
              setStatusText("");
              patch(reply.id, (m) => ({ ...m, content: m.content + event.d }));
              break;
            case "error":
              fail(event.d);
              break;
            case "done":
              sawDone = true;
              break;
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const raw = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!raw) continue;
            try {
              handle(JSON.parse(raw) as LynxStreamEvent);
            } catch {
              // A garbled line: ignore it, the next one carries the content.
            }
          }
        }

        // The connection ended without "done" or an error: the answer was cut off.
        if (!sawDone) {
          patch(reply.id, (m) => (m.error || m.content ? m : { ...m, error: LYNX_ERRORS.model }));
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Pressing Stop aborts on purpose. Keep whatever arrived; if nothing did, say so.
          patch(reply.id, (m) => (m.content ? m : { ...m, error: "Stopped. Ask again whenever you're ready." }));
        } else {
          console.error("[lynx] request failed", error);
          fail(LYNX_ERRORS.model);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setPhase("idle");
        setStatusText("");
      }
    },
    [patch],
  );

  const send = useCallback(
    (text: string) => {
      if (abortRef.current) return;
      void ask(text, withoutFailedTurns(messagesRef.current));
    },
    [ask],
  );

  /** Re-asks the last question after a failure. */
  const retry = useCallback(() => {
    if (abortRef.current) return;
    const current = messagesRef.current;
    const lastUser = [...current].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const index = current.findIndex((m) => m.id === lastUser.id);
    void ask(lastUser.content, withoutFailedTurns(current.slice(0, index)));
  }, [ask]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setPhase("idle");
    setStatusText("");
  }, []);

  return { messages, phase, statusText, send, retry, stop, clear, busy: phase !== "idle" };
}
