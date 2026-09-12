"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";

export default function WatchSection() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mainVideo = {
    id: "v16",
    number: "016",
    title: "Quick fitness routines you can do anywhere",
    category: "Health",
    author: "William Parker",
    readTime: "5 min read",
  };

  const videoCards = [
    {
      id: "v15",
      number: "015",
      title: "The future of electric cars explained simply",
      category: "Tech",
      author: "Jacob Anderson",
      readTime: "5 min read",
    },
    {
      id: "v12",
      number: "012",
      title: "How to create stunning travel vlogs easily",
      category: "Travel",
      author: "Sophia Harris",
      readTime: "4 min read",
    },
    {
      id: "v11",
      number: "011",
      title: "Exploring top street foods around the world",
      category: "Food",
      author: "Michael Smith",
      readTime: "3 min read",
    },
  ];

  return (
    <section className="w-full bg-[#050505] text-white py-20 sm:py-28 px-4 sm:px-6 border-t border-b border-[#222]">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Watch
          </h2>
          <Link
            href="/blog?category=watch"
            className="bg-white text-[#121212] px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider hover:bg-[#eae7e1] transition-colors uppercase"
          >
            VIEW ALL VIDEOS
          </Link>
        </div>

        <SectionDivider dark className="mt-8 mb-8" />

        {/* Main Featured Video */}
        <div className="border border-[#333] bg-[#111111] p-4 sm:p-5 rounded-sm mb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#888] mb-3">
            <span>ooo</span>
            <div className="flex-1 border-b border-dashed border-[#444]"></div>
            <span>[NO. {mainVideo.number}]</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Thumbnail Box */}
            <div className="lg:col-span-7 relative aspect-video w-full bg-[#1a1a1a] border border-[#333] overflow-hidden group">
              <Image
                src="/images/elephant.png"
                alt={mainVideo.title}
                fill
                className="object-cover transition-transform duration-300"
              />
              <button
                onClick={() => setPlayingId(mainVideo.id)}
                aria-label="Play video"
                className="absolute inset-0 m-auto w-14 h-14 bg-white/90 text-black rounded-full flex items-center justify-center shadow-lg group-hover:bg-white transition-all"
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full py-2">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-white mb-4">
                  {mainVideo.title}
                </h3>
              </div>
              <div className="flex items-center justify-between text-xs font-sans text-[#aaa]">
                <span className="font-semibold text-white uppercase tracking-wider">
                  {mainVideo.category}
                </span>
                <span>
                  by {mainVideo.author} | {mainVideo.readTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Video Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videoCards.map((vid) => (
            <div
              key={vid.id}
              className="border border-[#333] bg-[#111111] p-4 rounded-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#888] mb-3">
                <span>ooo</span>
                <div className="flex-1 border-b border-dashed border-[#444]"></div>
                <span>[NO. {vid.number}]</span>
              </div>

              <div className="relative aspect-[4/3] w-full bg-[#1a1a1a] border border-[#333] overflow-hidden mb-3.5 group">
                <Image
                  src="/images/elephant.png"
                  alt={vid.title}
                  fill
                  className="object-cover transition-transform duration-300"
                />
                <button
                  onClick={() => setPlayingId(vid.id)}
                  aria-label="Play video"
                  className="absolute inset-0 m-auto w-11 h-11 bg-white/90 text-black rounded-full flex items-center justify-center shadow-md group-hover:bg-white transition-all"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-sans text-[#aaa] mb-2">
                  <span className="font-semibold text-white uppercase">
                    {vid.category}
                  </span>
                  <span>
                    by {vid.author} | {vid.readTime}
                  </span>
                </div>
                <h4 className="font-serif text-lg font-semibold text-white leading-snug">
                  {vid.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
