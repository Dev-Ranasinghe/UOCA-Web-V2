"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArticleDetailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="BLOG" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-xs font-bold text-[#555] hover:text-[#121212] mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO BLOG
        </Link>

        {/* Article Meta */}
        <div className="card-header-line mb-4">
          <span className="card-header-line-center"></span>
          <span className="text-xs font-mono text-[#444] font-semibold">
            [NO. 999]
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-sans text-[#555] mb-4">
          <span className="font-semibold text-[#121212] uppercase tracking-wider bg-[#dfdcd5] px-2 py-0.5 rounded">
            Tech
          </span>
          <span>by Michael Smith | 7 min read | Sep 7, 2026</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#121212] leading-tight mb-8">
          Leo Club of Universities of Ceylon Alumni | Since 2016
        </h1>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] w-full border border-[#121212] bg-white overflow-hidden mb-10 rounded-sm">
          <Image
            src="/images/elephant.png"
            alt="Article illustration"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Article Content */}
        <div className="font-serif text-lg sm:text-xl text-[#222] leading-relaxed space-y-6">
          <p className="first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:leading-none">
            The Leo Club of Universities of Ceylon Alumni (UOCA) stands as a beacon of youth leadership, service, and cultural heritage preservation. Established in 2016, our mission connects alumni from across Sri Lanka to drive meaningful projects, support communities, and empower future generations.
          </p>

          <p>
            Through our digital publication READO, we curate stories, insights, and conversations spanning technology, design, culture, business, and sustainability. Every initiative is designed to create lasting impact and celebrate our collective identity.
          </p>

          <blockquote className="border-l-4 border-[#121212] pl-6 my-8 italic font-serif text-xl sm:text-2xl text-[#121212]">
            &ldquo;Our vision is to celebrate and preserve the stories, traditions, and identity that shape Sri Lanka, while creating meaningful connections that bring people together.&rdquo;
          </blockquote>

          <p>
            Join our community, contribute your perspective, or explore our latest podcasts and publication archives as we continue expanding impact across Sri Lanka and beyond.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
