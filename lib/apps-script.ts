import { createHash } from "node:crypto";
import { clientAddress, createRateLimiter } from "@/lib/rate-limit";

// Re-exported so the forms keep importing everything Apps Script related from one place.
export { createRateLimiter };

/**
 * Server-side plumbing shared by every form that ends up in the private Google Sheet
 * (membership application, newsletter). Browser -> server action -> this -> Apps Script Web App.
 * The Apps Script URL and secret live only in server env vars and never reach the browser.
 */

export type AppsScriptReply = {
  ok?: boolean;
  code?: string;
  message?: string;
  duplicate?: boolean;
  fields?: Record<string, string>;
};

export type AppsScriptOutcome =
  | { status: "reply"; reply: AppsScriptReply }
  | { status: "unconfigured" }
  | { status: "failed" };

const APPS_SCRIPT_TIMEOUT_MS = 25_000;

/**
 * Apps Script cannot see visitors' addresses, so it gets a salted hash to rate-limit on.
 * No raw IP ever leaves this server.
 */
export function visitorKey(h: Headers): string {
  return createHash("sha256")
    .update(`${process.env.APPS_SCRIPT_SECRET ?? ""}:${clientAddress(h)}`)
    .digest("hex")
    .slice(0, 32);
}

/** Sends one JSON payload (the secret is added here) to the Apps Script Web App and parses the answer. */
export async function callAppsScript(payload: Record<string, unknown>): Promise<AppsScriptOutcome> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) {
    console.error(
      "[apps-script] APPS_SCRIPT_URL or APPS_SCRIPT_SECRET is not set. Add both to .env.local (see apps-script/membership/README.md).",
    );
    return { status: "unconfigured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      // Apps Script reads the raw body, so plain text avoids any content-type handling on its side.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, ...payload }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS),
    });

    const raw = await response.text();
    try {
      return { status: "reply", reply: JSON.parse(raw) as AppsScriptReply };
    } catch {
      // Google answered with an HTML page: almost always a sign-in wall because "Who has access" is not "Anyone".
      console.error(
        `[apps-script] Non-JSON reply (HTTP ${response.status}). Check the deployment: Execute as "Me", access "Anyone", and that the latest code is deployed as a new version. Body starts: ${raw.slice(0, 120)}`,
      );
      return { status: "failed" };
    }
  } catch (error) {
    console.error("[apps-script] Could not reach Apps Script:", error);
    return { status: "failed" };
  }
}
