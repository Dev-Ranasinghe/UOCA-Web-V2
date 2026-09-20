"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { subscribeToNewsletter } from "@/app/subscribe/actions";
import { emailError, type SubscribeSource } from "@/lib/subscribe";
import { cn } from "@/lib/utils";

type Variant = "page" | "stamp" | "footer";

/**
 * The site's three newsletter sign-ups share this one form so they behave the same: validation, a loading
 * state, a confirmation, and a friendly error. Each variant keeps the look it already had on its page.
 * Inputs are 16px on phones so iOS Safari doesn't zoom the page when one is focused.
 */
const looks: Record<
  Variant,
  { pill: string; pillError: string; input: string; button: string; ok: string; error: string }
> = {
  page: {
    pill: "bg-white border border-[#121212] rounded-md p-2 shadow-sm",
    pillError: "border-[#b3261e]",
    input: "px-4 py-2 text-base md:text-sm text-[#121212] placeholder:text-[#767676] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_100px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#121212]",
    button: "bg-[#121212] text-white px-6 py-2.5 hover:bg-[#333] disabled:bg-[#555]",
    ok: "text-[#121212]",
    error: "text-[#b3261e]",
  },
  stamp: {
    pill: "bg-white border border-[#121212] rounded-md p-1.5 shadow-sm",
    pillError: "border-[#b3261e]",
    input: "px-3 py-1.5 text-base md:text-sm text-[#121212] placeholder:text-[#767676] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_100px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#121212]",
    button: "bg-[#121212] text-white px-5 py-2 hover:bg-[#333] disabled:bg-[#555]",
    ok: "text-[#121212]",
    error: "text-[#b3261e]",
  },
  footer: {
    pill: "bg-[#111111] border border-[#333] rounded-md p-1.5 focus-within:border-white",
    pillError: "border-[#ff9b93] focus-within:border-[#ff9b93]",
    input: "px-3 py-1.5 text-base md:text-xs text-white placeholder:text-[#8a8a8a] [&:-webkit-autofill]:[box-shadow:inset_0_0_0_100px_#111] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]",
    button: "bg-white text-black px-4 py-1.5 hover:bg-[#eae7e1] disabled:bg-[#999]",
    ok: "text-white",
    error: "text-[#ff9b93]",
  },
};

export default function SubscribeForm({
  variant,
  source,
  placeholder = "Enter your email",
  className,
}: {
  variant: Variant;
  source: SubscribeSource;
  placeholder?: string;
  className?: string;
}) {
  const look = looks[variant];
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [problem, setProblem] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "idle") return;

    const invalid = emailError(email);
    if (invalid) {
      setProblem(invalid);
      inputRef.current?.focus();
      return;
    }

    setStatus("submitting");
    setProblem(null);
    try {
      const result = await subscribeToNewsletter({
        email,
        source,
        website: honeypot,
        elapsedMs: Date.now() - shownAt.current,
      });
      if (result.ok) {
        setStatus("done");
        return;
      }
      setProblem(result.message);
    } catch (error) {
      console.error("[subscribe] sign-up failed", error);
      setProblem("We couldn't sign you up right now. Please try again in a moment.");
    }
    setStatus("idle");
  }

  if (status === "done") {
    return (
      <p role="status" className={cn("flex items-center gap-2 font-sans text-sm font-medium", look.ok, className)}>
        <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={3} />
        You&apos;re on the list. Thanks for subscribing.
      </p>
    );
  }

  const submitting = status === "submitting";

  return (
    <form noValidate onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className={cn("relative flex items-center transition-colors", look.pill, problem && look.pillError)}>
        <input
          ref={inputRef}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          aria-label="Email address"
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? messageId : undefined}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (problem) setProblem(null);
          }}
          className={cn("w-full min-w-0 bg-transparent font-sans outline-none", look.input)}
        />
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded font-mono text-xs font-bold tracking-wider transition-colors disabled:cursor-not-allowed",
            look.button,
          )}
        >
          {submitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
              SUBSCRIBING
            </>
          ) : (
            "SUBSCRIBE"
          )}
        </button>
      </div>

      {/* Honeypot: people never see or reach this; bots that fill every input give themselves away. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {problem ? (
        <p id={messageId} role="alert" className={cn("mt-2 font-sans text-sm font-medium leading-snug", look.error)}>
          {problem}
        </p>
      ) : null}
    </form>
  );
}
