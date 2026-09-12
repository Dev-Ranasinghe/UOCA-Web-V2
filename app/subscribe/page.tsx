"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="SUBSCRIBE" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center">
        {/* Large Dashed Stamp Card */}
        <div className="w-full stamp-container p-8 sm:p-14 rounded-sm text-center my-8">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#121212] mb-4">
            Stay in the loop
          </h1>
          <p className="font-sans text-base sm:text-lg text-[#555] max-w-xl mx-auto mb-8 leading-relaxed">
            Get the latest stories, insights, and updates delivered straight to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="relative flex items-center bg-white border border-[#121212] rounded-md p-2 shadow-sm">
              <input
                type="email"
                required
                placeholder="Add your email to subscribe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm font-sans px-4 py-2 text-[#121212] placeholder-[#777] outline-none"
              />
              <button
                type="submit"
                className="bg-[#121212] text-white px-6 py-2.5 rounded text-xs font-mono font-bold tracking-wider hover:bg-[#333] transition-colors whitespace-nowrap"
              >
                {submitted ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
              </button>
            </div>
          </form>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3 font-sans text-xs text-[#555] my-6">
          <span>Stay connected:</span>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="w-7 h-7 border border-[#121212] rounded flex items-center justify-center font-mono font-bold text-xs hover:bg-[#121212] hover:text-white transition-colors"
            >
              in
            </a>
            <a
              href="#"
              className="w-7 h-7 border border-[#121212] rounded flex items-center justify-center font-mono font-bold text-xs hover:bg-[#121212] hover:text-white transition-colors"
            >
              f
            </a>
            <a
              href="#"
              className="w-7 h-7 border border-[#121212] rounded flex items-center justify-center font-mono font-bold text-xs hover:bg-[#121212] hover:text-white transition-colors"
            >
              X
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
