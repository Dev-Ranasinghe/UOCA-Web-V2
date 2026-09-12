"use client";

import React, { useState } from "react";

export default function NewsletterStamp() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="stamp-container p-6 sm:p-8 rounded-sm my-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#121212] mb-1">
                Don&apos;t miss a thing
              </h3>
              <p className="font-sans text-sm text-[#444] leading-relaxed">
                Subscribe to get updates straight to your inbox.
              </p>
            </div>

            {/* Vintage Postmark Stamp Icon */}
            <div className="hidden sm:flex flex-col items-center justify-center border-2 border-dashed border-[#555] rounded-full w-20 h-20 p-1 text-center font-mono text-[9px] text-[#444] leading-tight select-none opacity-85 rotate-[-6deg]">
              <span className="font-bold tracking-tighter">CAIRO</span>
              <span className="border-t border-b border-[#555] px-1 py-0.5 my-0.5 font-bold">
                22 APR 1950
              </span>
              <span>EGYPT</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex items-center">
            <div className="relative w-full flex items-center bg-white border border-[#121212] rounded-md p-1.5 shadow-sm">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm font-sans px-3 py-1.5 text-[#121212] placeholder-[#777] outline-none"
              />
              <button
                type="submit"
                className="bg-[#121212] text-white px-5 py-2 rounded text-xs font-mono font-bold tracking-wider hover:bg-[#333] transition-colors whitespace-nowrap"
              >
                {subscribed ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
