"use client";

import React from "react";

interface SectionDividerProps {
  className?: string;
  /** use light-on-dark styling for sections with a black/dark background */
  dark?: boolean;
  /** Apply the standard gap above and below (--divider-gap). */
  spaced?: boolean;
}

export default function SectionDivider({ className = "", dark = false, spaced = false }: SectionDividerProps) {
  const color = dark ? "text-white" : "text-[#121212]";
  const borderColor = dark ? "border-white" : "border-[#121212]";

  return (
    <div className={`w-full flex items-center relative ${color} ${spaced ? "my-[var(--divider-gap)]" : ""} ${className}`}>
      {/* Left Plus/Tick Mark */}
      <span className="font-mono text-xs font-bold leading-none select-none z-10 relative -mr-[3px]">
        +
      </span>
      {/* Horizontal Line */}
      <div className={`flex-1 border-b ${borderColor}`}></div>
      {/* Right Plus/Tick Mark */}
      <span className="font-mono text-xs font-bold leading-none select-none z-10 relative -ml-[3px]">
        +
      </span>
    </div>
  );
}
