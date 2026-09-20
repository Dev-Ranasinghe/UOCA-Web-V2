import { z } from "zod";
import {
  LYNX_ERRORS,
  LYNX_HISTORY_MESSAGES,
  LYNX_MAX_MESSAGE_CHARS,
  type LynxMessage,
  type LynxStreamEvent,
} from "@/lib/lynx/config";
import { LynxModelError, runLynx } from "@/lib/lynx/gemini";
import { LynxDataError } from "@/lib/lynx/tools";
import { clientAddress, createRateLimiter } from "@/lib/rate-limit";

/**
 * POST /api/lynx: the endpoint behind the LYNX chat.
 *
 * Browser -> here (validates, rate-limits) -> lib/lynx/gemini.ts (asks Gemini, runs database tools) -> streamed answer.
 * The Gemini key stays on the server. Conversations are never stored: they exist only in the visitor's open tab and
 * in this request while it runs. Nothing about a question is logged; only failures are, without message text.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 16 * 1024;
/** Assistant turns are sent back only as context, so they are trimmed. Their length is not the visitor's to set. */
const MAX_ASSISTANT_CONTEXT_CHARS = 1_200;

const perVisitor = createRateLimiter(20, 5 * 60 * 1000);
const acrossSite = createRateLimiter(600, 60 * 60 * 1000);

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4_000),
      }),
    )
    .min(1)
    .max(40),
});

const encoder = new TextEncoder();
const line = (event: LynxStreamEvent) => encoder.encode(`${JSON.stringify(event)}\n`);

function reject(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Strips control characters and collapses runs of blank lines. */
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\n{3,}/g, "\n\n").trim();

export async function POST(request: Request) {
  // Only our own pages should be calling this.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return reject(403, "Forbidden");
  if (!request.headers.get("content-type")?.includes("application/json")) return reject(415, LYNX_ERRORS.invalid);

  const visitor = clientAddress(request.headers);
  if (perVisitor(visitor) || acrossSite("all")) return reject(429, LYNX_ERRORS.rateLimited);

  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return reject(413, LYNX_ERRORS.invalid);
    const result = bodySchema.safeParse(JSON.parse(raw));
    if (!result.success) return reject(400, LYNX_ERRORS.invalid);
    parsed = result.data;
  } catch {
    return reject(400, LYNX_ERRORS.invalid);
  }

  const cleaned: LynxMessage[] = parsed.messages
    .map((m) => ({ role: m.role, content: clean(m.content) }))
    .filter((m) => m.content.length > 0)
    .map((m) => (m.role === "assistant" ? { ...m, content: m.content.slice(0, MAX_ASSISTANT_CONTEXT_CHARS) } : m));

  const latest = cleaned[cleaned.length - 1];
  if (!latest || latest.role !== "user") return reject(400, LYNX_ERRORS.invalid);
  if (latest.content.length > LYNX_MAX_MESSAGE_CHARS) {
    return reject(400, `Please keep your question under ${LYNX_MAX_MESSAGE_CHARS} characters.`);
  }
  // Older user turns are also capped, so a long pasted message can't be smuggled in as "history".
  const history = cleaned.slice(-LYNX_HISTORY_MESSAGES).map((m) => (m.role === "user" ? { ...m, content: m.content.slice(0, LYNX_MAX_MESSAGE_CHARS) } : m));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: LynxStreamEvent) => {
        try {
          controller.enqueue(line(event));
        } catch {
          // The visitor closed the chat; nothing left to send to.
        }
      };

      try {
        for await (const event of runLynx(history, request.signal)) {
          if (event.type === "text") send({ t: "text", d: event.text });
          else if (event.type === "status") send({ t: "status", d: event.text });
          else send({ t: "links", d: event.urls });
        }
        send({ t: "done" });
      } catch (error) {
        if (request.signal.aborted) return;
        if (error instanceof LynxDataError) {
          send({ t: "error", d: LYNX_ERRORS.data, retry: true });
        } else {
          if (!(error instanceof LynxModelError)) console.error("[lynx] Unexpected failure:", error);
          send({ t: "error", d: LYNX_ERRORS.model, retry: true });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
