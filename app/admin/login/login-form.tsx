"use client";

import * as React from "react";
import { useActionState } from "react";
import { DotGridCanvas } from "@/components/ui/dot-grid-canvas";
import {
  signInWithPassword,
  signUpWithPassword,
  type AuthActionState,
} from "./actions";

const initialState: AuthActionState = {};

const inputClass =
  "h-11 w-full rounded-[10px] border-2 border-(color:--nb-ink) bg-white px-3.5 text-[0.95rem] text-(color:--nb-ink) outline-none transition-shadow placeholder:text-[#6e6879] focus:shadow-[3px_3px_0_var(--nb-ink)]";

const submitButtonClass =
  "h-11 w-full rounded-[10px] border-2 border-(color:--nb-ink) bg-(--nb-yellow) text-[0.95rem] font-bold text-(color:--nb-ink) shadow-[3px_3px_0_var(--nb-ink)] transition-[translate,box-shadow] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--nb-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--nb-ink)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--nb-ink) disabled:cursor-not-allowed disabled:opacity-60";

// Ink, purple, blue, green, yellow, pink: the admin palette, as 0..1 RGB for the dot-grid shader.
const DOT_COLORS: [number, number, number][] = [
  [0.086, 0.086, 0.086],
  [0.725, 0.612, 0.914],
  [0.561, 0.651, 0.851],
  [0.447, 0.784, 0.608],
  [0.949, 0.776, 0.29],
  [0.945, 0.604, 0.608],
];
const DOT_OPACITIES = [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6, 0.75, 0.9];

function Logo() {
  return (
    <div className="mb-4 flex size-12 items-center justify-center rounded-xl border-2 border-(color:--nb-ink) bg-(--nb-yellow) text-lg font-extrabold shadow-[3px_3px_0_var(--nb-ink)]">
      U
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-4 text-center text-xs leading-[1.5] text-(color:--nb-muted)">
      By proceeding, you agree to creating a UOCA admin account
      <br />
      subject to our{" "}
      <a href="#" className="font-semibold text-(color:--nb-ink) underline underline-offset-2">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" className="font-semibold text-(color:--nb-ink) underline underline-offset-2">
        Privacy Policy
      </a>
      .
    </div>
  );
}

export function LoginForm({ next, unauthorized }: { next?: string; unauthorized?: boolean }) {
  const [isLogin, setIsLogin] = React.useState(true);
  const action = isLogin ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-hidden bg-(--nb-lavender) font-sans text-(color:--nb-ink)">
      <DotGridCanvas colors={DOT_COLORS} opacities={DOT_OPACITIES} totalSize={22} dotSize={6} className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,var(--nb-lavender)_0%,rgb(240_234_251/0.85)_35%,rgb(240_234_251/0)_85%)]" />

      <header className="relative z-10 border-b-2 border-(color:--nb-ink) bg-(--nb-yellow) shadow-[0_3px_0_rgb(22_22_22/0.12)]">
        <div className="flex h-16 items-center px-4 md:h-[4.5rem] md:px-6">
          <span className="text-[1.3rem] leading-[0.95] font-medium tracking-[-0.02em] md:text-[1.45rem]">
            UOCA
            <br />
            .ADMIN
          </span>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col items-center rounded-[22px] border-2 border-(color:--nb-ink) bg-white p-6 shadow-[6px_6px_0_var(--nb-ink)] sm:p-8">
        <div className="flex w-full max-w-[360px] flex-col items-center text-center">
          <Logo />
          <h1 className="mb-1 text-[1.6rem] font-bold tracking-[-0.025em]">
            {isLogin ? "Sign in to Account" : "Sign up for Account"}
          </h1>
          <p className="mb-5 text-[0.9rem] leading-[1.5] text-(color:--nb-muted)">
            {isLogin ? "Sign in to your Account." : "Create a new account to get started."}
          </p>

          {unauthorized ? (
            <p className="mb-[0.65rem] w-full rounded-[10px] border-2 border-(color:--nb-ink) bg-(--nb-blush) px-3.5 py-2.5 text-left text-[0.85rem] font-medium text-[#8a1f16]">
              That account isn&apos;t registered as an admin yet. Ask a Super Admin to grant access, then sign in again.
            </p>
          ) : null}
          {state.error ? (
            <p className="mb-[0.65rem] w-full rounded-[10px] border-2 border-(color:--nb-ink) bg-(--nb-blush) px-3.5 py-2.5 text-left text-[0.85rem] font-medium text-[#8a1f16]" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.info ? (
            <p className="mb-[0.65rem] w-full rounded-[10px] border-2 border-(color:--nb-ink) bg-[#e4f5eb] px-3.5 py-2.5 text-left text-[0.85rem] font-medium" role="status">
              {state.info}
            </p>
          ) : null}

          <form action={formAction} className="flex w-full flex-col gap-3">
            <input type="hidden" name="next" value={next ?? ""} />
            {!isLogin ? <input className={inputClass} type="text" name="name" placeholder="Full Name" required /> : null}
            <input className={inputClass} type="email" name="email" autoComplete="email" placeholder="name@work-email.com" required />
            <input
              className={inputClass}
              type="password"
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="Password"
              required
              minLength={isLogin ? undefined : 8}
            />
            <button type="submit" disabled={pending} className={submitButtonClass}>
              {pending ? "…" : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-5 text-sm text-(color:--nb-muted)">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="cursor-pointer border-none bg-transparent p-0 font-bold text-(color:--nb-ink) underline underline-offset-2"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="cursor-pointer border-none bg-transparent p-0 font-bold text-(color:--nb-ink) underline underline-offset-2"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
          <Footer />
        </div>
      </div>
      </div>
    </div>
  );
}
