"use client";

import React, { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import { ShoppingBag } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const authors = [
    "Emily Johnson",
    "Jacob Anderson",
    "Sophia Harris",
    "Michael Smith",
    "Benjamin Scott",
    "Ethan Miller",
    "William Parker",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="CONTACT" />

      <main className="page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-11 md:gap-14 lg:gap-20">
          {/* Left Column — About Us */}
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#121212] mb-3 md:mb-6">
              About Us
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-3 md:mb-5">
              Welcome to Reado, your go-to source for insights, tips, and
              stories that inspire curiosity and learning. Our mission is to
              provide readers with high-quality content across topics like
              lifestyle, travel, productivity, health, finance, and
              technology.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-0 md:mb-8">
              We&apos;re passionate about storytelling, creating a space
              where ideas come alive, curiosity thrives, and readers feel
              inspired to make informed choices.
            </p>

            <SectionDivider className="my-5 md:mt-0 md:mb-10" />

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mb-5">
              Our founder
            </h2>
            <div className="flex flex-row gap-4 md:gap-5 mb-6 md:mb-10">
              <div className="relative w-[104px] aspect-[5/4] self-start md:self-auto md:w-40 md:aspect-square border border-[#121212] bg-[#e0ddd5] overflow-hidden flex-shrink-0">
                <Image
                  src="/images/founder.jpg"
                  alt="Frances Guerrero"
                  fill
                  sizes="(min-width: 768px) 160px, 104px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-bold text-[#121212] mb-1">
                  Frances Guerrero
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <a
                    href="#"
                    className="w-6 h-6 border border-[#121212] rounded flex items-center justify-center text-[10px] font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors"
                  >
                    in
                  </a>
                  <a
                    href="#"
                    className="w-6 h-6 border border-[#121212] rounded flex items-center justify-center text-[10px] font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors"
                  >
                    f
                  </a>
                  <a
                    href="#"
                    className="w-6 h-6 border border-[#121212] rounded flex items-center justify-center text-[10px] font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors"
                  >
                    X
                  </a>
                </div>
                <p className="font-sans text-sm text-[#333] leading-relaxed">
                  The Founder and Editor-in-Chief of Reado, guiding its
                  editorial vision and overseeing content that sparks
                  curiosity, inspires creativity, and engages readers with
                  thoughtful storytelling.
                </p>
              </div>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mb-4">
              Authors
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5 md:grid md:grid-cols-3 md:gap-x-4 md:gap-y-3">
              {authors.map((name) => (
                <span
                  key={name}
                  className="font-mono text-xs font-bold tracking-wide uppercase text-[#121212]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column — Contact form */}
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#121212] mb-6 md:mb-8">
              Contact us
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5 mb-0 md:mb-8">
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                <div>
                  <label className="block font-sans text-sm font-medium text-[#121212] mb-2">
                    Name*
                  </label>
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
                  <label className="block font-sans text-sm font-medium text-[#121212] mb-2">
                    Email*
                  </label>
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
                <label className="block font-sans text-sm font-medium text-[#121212] mb-2">
                  Message
                </label>
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

            <SectionDivider className="my-5 md:mt-0 md:mb-10" />

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mb-4">
              Collaborate or Partner
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-4">
              Interested in joining the Reado team, exploring partnerships,
              or sharing ideas? We&apos;d love to connect.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-4 md:mb-8">
              We don&apos;t exchange products for features or run banner
              ads, but we&apos;re always open to meaningful collaborations.
              Reach out anytime at{" "}
              <a
                href="mailto:partnerships@reado.com"
                className="font-bold underline hover:opacity-80"
              >
                partnerships@reado.com
              </a>
            </p>

            <div className="flex justify-end mb-0 md:mb-8">
              <button className="bg-white text-[#121212] text-xs font-sans font-bold px-4 py-2.5 rounded-sm shadow-sm border border-[#121212] flex items-center gap-1.5 hover:bg-[#f7f5f0] transition-colors">
                Get it for FREE <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            </div>

            <SectionDivider className="mt-5 md:mt-0" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
