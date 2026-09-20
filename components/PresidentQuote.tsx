"use client";

import React from "react";
import Image from "next/image";

export default function PresidentQuote() {
  return (
    <section className="w-full px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
      {/* Boxed Elephant Illustration */}
      <div className="w-full max-w-lg border border-[#121212] bg-[#f7f5f0] p-4 rounded-sm shadow-sm mb-10">
        <div className="card-header-line mb-3">
          <span className="card-header-line-center"></span>
        </div>

        <div className="relative aspect-[4/3] w-full border border-[#121212] overflow-hidden bg-white">
          <Image
            src="/images/elephant.png"
            alt="Elephant Stipple Illustration - Leo Club of UOC Alumni"
            fill
            sizes="(min-width: 512px) 480px, 100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Quote text */}
      <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl text-[#121212] italic leading-relaxed max-w-3xl mb-6">
        &ldquo;My vision is to celebrate and preserve the stories, traditions, and identity that shape Sri Lanka, while creating meaningful connections that bring people together and transforming our collective passion into projects that create lasting value for our communities and generations to come.&rdquo;
      </blockquote>

      {/* Subtitle Divider Line */}
      <div className="w-full max-w-md flex items-center justify-center gap-3 my-4 font-mono text-xs text-[#555]">
        <div className="flex-1 border-b border-dashed border-[#888]"></div>
        <span>ooo</span>
        <div className="flex-1 border-b border-dashed border-[#888]"></div>
      </div>

      {/* Author Details */}
      <div className="mt-2">
        <h4 className="font-serif font-bold text-lg text-[#121212]">
          Leo Sasun Wijeratne
        </h4>
        <p className="font-sans text-xs text-[#555] tracking-wide font-medium mt-0.5">
          President, Leo Club of UOC Alumni
        </p>
      </div>
    </section>
  );
}
