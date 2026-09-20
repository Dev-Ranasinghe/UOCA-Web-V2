"use server";

import { headers } from "next/headers";
import { callAppsScript, createRateLimiter, visitorKey } from "@/lib/apps-script";
import {
  collectErrors,
  normalizeApplication,
  referenceFromSubmissionId,
  submissionSchema,
  type FieldKey,
} from "@/lib/membership/application";

/**
 * Membership application, server side.
 *
 * Browser -> this action -> Google Apps Script Web App -> private Google Sheet.
 *
 * Why an action in the middle instead of the browser calling Apps Script directly: the Apps Script URL and the
 * shared secret stay on the server. Apps Script rejects any request without the secret, so someone who finds the
 * public /exec URL cannot fill the sheet with junk. Nothing here is a complete defence against a determined
 * attacker; it stops casual abuse.
 */

type SubmitFailure = {
  ok: false;
  code: "VALIDATION" | "DUPLICATE" | "RATE_LIMITED" | "UNAVAILABLE" | "ERROR";
  message: string;
  fieldErrors?: Partial<Record<FieldKey, string>>;
};

export type SubmitResult = { ok: true; reference: string } | SubmitFailure;

/** No human completes seventeen fields, a choice grid and a declaration in three seconds. */
const MIN_FILL_TIME_MS = 3_000;

const isRateLimited = createRateLimiter(5, 15 * 60 * 1000);

const GENERIC_ERROR: SubmitFailure = {
  ok: false,
  code: "ERROR",
  message: "We couldn't submit your application right now. Please try again in a moment.",
};

export async function submitMembershipApplication(input: unknown): Promise<SubmitResult> {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Some answers need another look. Please check the highlighted fields.",
      fieldErrors: collectErrors(parsed.error.issues),
    };
  }
  const submission = parsed.data;
  const reference = referenceFromSubmissionId(submission.submissionId);

  // Bots: a filled honeypot or an instant submit. Answer as if it worked so they learn nothing, store nothing.
  if (submission.website || (submission.elapsedMs ?? MIN_FILL_TIME_MS) < MIN_FILL_TIME_MS) {
    console.warn("[membership] dropped a likely bot submission");
    return { ok: true, reference };
  }

  const clientKey = visitorKey(await headers());
  if (isRateLimited(clientKey)) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "You've submitted a few times in a short while. Please wait a few minutes and try again.",
    };
  }

  const outcome = await callAppsScript({
    type: "membership",
    clientKey,
    submissionId: submission.submissionId,
    reference,
    ...normalizeApplication(submission),
  });

  if (outcome.status === "unconfigured") return { ok: false, code: "UNAVAILABLE", message: GENERIC_ERROR.message };
  if (outcome.status === "failed") return GENERIC_ERROR;

  const { reply } = outcome;
  if (reply.ok) return { ok: true, reference };

  console.error("[membership] Apps Script rejected the submission:", reply.code, reply.message);
  switch (reply.code) {
    case "DUPLICATE_APPLICATION":
      return {
        ok: false,
        code: "DUPLICATE",
        message:
          "We already have an application with this email address or NIC number. If you think that's a mistake, please contact the club and we'll sort it out.",
      };
    case "RATE_LIMITED":
      return {
        ok: false,
        code: "RATE_LIMITED",
        message: "We're getting a lot of applications right now. Please try again in a few minutes.",
      };
    case "VALIDATION":
      return {
        ok: false,
        code: "VALIDATION",
        message: "Some answers need another look. Please check the highlighted fields.",
        fieldErrors: reply.fields as Partial<Record<FieldKey, string>> | undefined,
      };
    default:
      return GENERIC_ERROR;
  }
}
