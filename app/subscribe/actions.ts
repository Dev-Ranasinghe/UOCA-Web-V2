"use server";

import { headers } from "next/headers";
import { callAppsScript, createRateLimiter, visitorKey } from "@/lib/apps-script";
import { subscribeSchema } from "@/lib/subscribe";

/**
 * Newsletter sign-up, server side. Same route as the membership form:
 * browser -> this action -> Google Apps Script -> the "Sheet2" tab of the private sheet.
 *
 * A repeat sign-up is reported as success on purpose, so nobody can use the form to find out whether
 * a particular address is already on the list.
 */

type SubscribeFailure = { ok: false; code: "VALIDATION" | "RATE_LIMITED" | "ERROR"; message: string };

export type SubscribeResult = { ok: true } | SubscribeFailure;

/** One click by hand takes longer than this; an instant submit is a script. */
const MIN_FILL_TIME_MS = 1_000;

const isRateLimited = createRateLimiter(8, 15 * 60 * 1000);

const GENERIC_ERROR: SubscribeFailure = {
  ok: false,
  code: "ERROR",
  message: "We couldn't sign you up right now. Please try again in a moment.",
};

export async function subscribeToNewsletter(input: unknown): Promise<SubscribeResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    // Only the email can be wrong in a normal submission; anything else means the request was tampered with.
    return {
      ok: false,
      code: "VALIDATION",
      message: first?.path[0] === "email" ? first.message : GENERIC_ERROR.message,
    };
  }
  const { email, source, website, elapsedMs } = parsed.data;

  // Bots: a filled honeypot or an instant submit. Answer as if it worked, store nothing.
  if (website || (elapsedMs ?? MIN_FILL_TIME_MS) < MIN_FILL_TIME_MS) {
    console.warn("[subscribe] dropped a likely bot submission");
    return { ok: true };
  }

  const clientKey = visitorKey(await headers());
  if (isRateLimited(clientKey)) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "Too many attempts in a short while. Please wait a few minutes and try again.",
    };
  }

  const outcome = await callAppsScript({ type: "subscribe", clientKey, email: email.toLowerCase(), source });
  if (outcome.status !== "reply") return GENERIC_ERROR;

  const { reply } = outcome;
  if (reply.ok) return { ok: true };

  console.error("[subscribe] Apps Script rejected the sign-up:", reply.code, reply.message);
  if (reply.code === "RATE_LIMITED") {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "We're getting a lot of sign-ups right now. Please try again in a few minutes.",
    };
  }
  if (reply.code === "VALIDATION") {
    // The address already passed our own check, so the script disagreeing about the email alone is unusual. Any other
    // field complaint means the deployed script is an old version that treats this as a membership application.
    const onlyEmail = reply.fields && Object.keys(reply.fields).join() === "email";
    if (!onlyEmail) {
      console.error(
        "[subscribe] The deployed Apps Script does not understand newsletter sign-ups. Paste the latest Code.gs and deploy a NEW VERSION (apps-script/membership/README.md).",
      );
      return GENERIC_ERROR;
    }
    return { ok: false, code: "VALIDATION", message: "Enter a valid email address, like name@example.com." };
  }
  return GENERIC_ERROR;
}
