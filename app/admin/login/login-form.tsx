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
  "w-full rounded-[6px] border border-[#333] bg-black px-[0.85rem] py-[0.65rem] text-sm text-white outline-none transition-colors focus:border-white/50";

const submitButtonClass =
  "w-full rounded-[6px] border-none bg-[#ededed] py-[0.65rem] text-sm font-medium text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

function Logo() {
  return (
    <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-[#333] bg-[#111] font-serif text-[1.15rem] font-bold">
      U
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-[0.85rem] text-center text-xs leading-[1.5] text-[#666]">
      By proceeding, you agree to creating a UOCA admin account
      <br />
      subject to our{" "}
      <a href="#" className="text-[#888] transition-colors hover:text-white">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" className="text-[#888] transition-colors hover:text-white">
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
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black font-sans text-white">
      <DotGridCanvas className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0)_100%)]" />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center rounded-xl border border-[#222] bg-[#121212] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] sm:p-8">
        <div className="flex w-full max-w-[360px] flex-col items-center text-center">
          <Logo />
          <h1 className="mb-1 text-[1.35rem] font-semibold tracking-[-0.025em]">
            {isLogin ? "Sign in to Account" : "Sign up for Account"}
          </h1>
          <p className="mb-[0.85rem] text-[0.85rem] leading-[1.5] text-[#888]">
            {isLogin ? "Sign in to your Account." : "Create a new account to get started."}
          </p>

          {unauthorized ? (
            <p className="mb-[0.65rem] w-full rounded-[6px] border border-[#b3261e]/40 bg-[#b3261e]/10 px-[0.85rem] py-[0.65rem] text-[0.8rem] text-[#ff9d90]">
              That account isn&apos;t registered as an admin yet. Ask a Super Admin to grant access, then sign in again.
            </p>
          ) : null}
          {state.error ? (
            <p className="mb-[0.65rem] w-full rounded-[6px] border border-[#b3261e]/40 bg-[#b3261e]/10 px-[0.85rem] py-[0.65rem] text-[0.8rem] text-[#ff9d90]" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.info ? (
            <p className="mb-[0.65rem] w-full rounded-[6px] border border-[#333] bg-white/5 px-[0.85rem] py-[0.65rem] text-[0.8rem] text-[#ccc]" role="status">
              {state.info}
            </p>
          ) : null}

          <form action={formAction} className="flex w-full flex-col gap-[0.65rem]">
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

          <div className="mt-5 text-sm text-[#888]">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="cursor-pointer border-none bg-transparent p-0 font-medium text-white hover:underline"
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
                  className="cursor-pointer border-none bg-transparent p-0 font-medium text-white hover:underline"
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
  );
}
