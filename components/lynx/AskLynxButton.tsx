"use client";

import type { ReactNode } from "react";

/** Opens the floating LYNX chat (see LynxWidget), optionally asking a question straight away. */
export function openLynx(prompt?: string) {
  window.dispatchEvent(new CustomEvent("lynx:open", { detail: { prompt } }));
}

export default function AskLynxButton({
  prompt,
  className,
  children,
}: {
  prompt?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={() => openLynx(prompt)} className={className}>
      {children}
    </button>
  );
}
