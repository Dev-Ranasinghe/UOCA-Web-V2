"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email) setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mb-0 md:mb-8">
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        <div>
          <label className="block font-sans text-sm font-medium text-[#121212] mb-2">Name*</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your name"
            className="w-full bg-transparent border border-[#999] rounded-lg px-4 py-3.5 text-sm font-sans text-[#121212] placeholder-[#666] outline-none focus:border-[#121212] transition-colors"
          />
        </div>
        <div>
          <label className="block font-sans text-sm font-medium text-[#121212] mb-2">Email*</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter your email"
            className="w-full bg-transparent border border-[#999] rounded-lg px-4 py-3.5 text-sm font-sans text-[#121212] placeholder-[#666] outline-none focus:border-[#121212] transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block font-sans text-sm font-medium text-[#121212] mb-2">Message</label>
        <textarea
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Enter your message"
          className="w-full bg-transparent border border-[#999] rounded-lg px-4 py-3.5 text-sm font-sans text-[#121212] placeholder-[#666] outline-none focus:border-[#121212] transition-colors resize-y"
        />
      </div>
      <button
        type="submit"
        className="bg-[#121212] text-white text-xs font-mono font-bold tracking-wider px-6 py-3 rounded-sm hover:bg-[#333] transition-colors"
      >
        {submitted ? "SUBMITTED ✓" : "SUBMIT"}
      </button>
    </form>
  );
}
