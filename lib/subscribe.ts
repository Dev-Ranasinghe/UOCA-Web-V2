import { z } from "zod";
import { EMAIL_PATTERN } from "@/lib/membership/application";

/** Which newsletter form the address came from. Stored in the sheet so you can see what works. */
export const SUBSCRIBE_SOURCES = ["subscribe-page", "footer", "home"] as const;
export type SubscribeSource = (typeof SUBSCRIBE_SOURCES)[number];

const emailField = z
  .string({ error: "Enter your email address." })
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .refine((v) => EMAIL_PATTERN.test(v), "Enter a valid email address, like name@example.com.");

/** What the browser sends to the server action: the address plus anti-abuse metadata. */
export const subscribeSchema = z.object({
  email: emailField,
  source: z.enum(SUBSCRIBE_SOURCES),
  /** Honeypot: hidden from people, so only a bot fills it in. */
  website: z.string().max(500).optional(),
  /** Milliseconds between the form appearing and Submit. */
  elapsedMs: z.number().finite().optional(),
});

/** The first problem with an email address as typed, or undefined when it is fine. */
export function emailError(value: string): string | undefined {
  const result = emailField.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
