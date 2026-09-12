"use client";

import React from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AuthorsPage() {
  const authors = [
    {
      name: "Emily Johnson",
      role: "Expert in online business growth and digital sales strategies.",
    },
    {
      name: "Jacob Anderson",
      role: "Focused on creating impactful global campaigns.",
    },
    {
      name: "Sophia Harris",
      role: "Passionate about improving user experiences in online shopping.",
    },
    {
      name: "Michael Smith",
      role: "Specializes in developing and optimizing digital products.",
    },
    {
      name: "Benjamin Scott",
      role: "Experienced in streamlining e-commerce logistics and operations.",
    },
    {
      name: "Ethan Miller",
      role: "Focused on digital transformation and innovative tech solutions.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="AUTHORS" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto my-8">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212] mb-3">
            Authors
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#555]">
            Dive into the minds behind the stories and conversations you love.
          </p>
        </div>

        {/* 3-Column Author Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-10">
          {authors.map((author) => (
            <div
              key={author.name}
              className="border border-[#121212] bg-[#f7f5f0] p-4 rounded-sm flex flex-col justify-between"
            >
              {/* Elephant Avatar Box */}
              <div className="relative aspect-square w-full border border-[#121212] bg-[#e0ddd5] overflow-hidden mb-4 group">
                <Image
                  src="/images/elephant.png"
                  alt={author.name}
                  fill
                  className="object-cover transition-transform duration-300"
                />
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-[#121212] mb-1">
                  {author.name}
                </h3>
                <p className="font-sans text-xs text-[#555] leading-relaxed mb-4">
                  {author.role}
                </p>

                {/* Social Icons */}
                <div className="flex items-center gap-3 text-xs font-mono font-bold text-[#121212]">
                  <a href="#" className="hover:opacity-70">in</a>
                  <a href="#" className="hover:opacity-70">f</a>
                  <a href="#" className="hover:opacity-70">X</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center my-8">
          <button className="bg-[#121212] text-white text-xs font-mono font-bold px-8 py-3 rounded-sm hover:bg-[#333] transition-colors tracking-widest uppercase">
            LOAD MORE
          </button>
        </div>

        {/* Career Callout Banner */}
        <div className="border-t border-b border-[#121212] py-8 text-center my-12">
          <p className="font-serif text-lg sm:text-xl text-[#121212]">
            Love creating content? Join the Reado team! Apply now at{" "}
            <a
              href="mailto:career@reado.com"
              className="font-bold underline hover:opacity-80"
            >
              career@reado.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
