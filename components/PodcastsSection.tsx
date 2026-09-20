"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Pause, Radio, Disc, Mic, Volume2 } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";

export default function PodcastsSection() {
  const [playingEp, setPlayingEp] = useState<string | null>(null);

  const podcasts = [
    {
      id: "ep005",
      epNumber: "EP. 005",
      title: "How design is changing in the digital age",
      author: "William Parker",
      duration: "1hr 25min",
      coverTitle: "MAKE YOUR DREAM REAL",
      coverAuthor: "BY LOUIS FERGUSON",
      bgClass: "bg-[#fbe3a1]",
    },
    {
      id: "ep004",
      epNumber: "EP. 004",
      title: "The remote revolution – rethinking work and culture",
      author: "William Parker",
      duration: "3hr 06min",
      coverTitle: "STAND-UP COMEDY",
      coverAuthor: "BY JUDY NGUYEN",
      bgClass: "bg-[#f4f2ed]",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#121212]">
        Podcasts
      </h2>

      <SectionDivider spaced />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {podcasts.map((pod) => {
          const isPlaying = playingEp === pod.id;
          return (
            <div
              key={pod.id}
              className="border border-[#121212] bg-[#f7f5f0] p-4 sm:p-5 rounded-sm flex flex-col justify-between"
            >
              {/* Header Dotted Line */}
              <div className="card-header-line mb-4">
                <span className="card-header-line-center"></span>
                <span className="text-xs font-mono text-[#444] font-semibold">
                  [{pod.epNumber}]
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Podcast Cover Graphic */}
                <div
                  className={`sm:col-span-5 aspect-square relative border border-[#121212] p-4 flex flex-col justify-between overflow-hidden ${pod.bgClass}`}
                >
                  <Image
                    src="/images/elephant.png"
                    alt={pod.title}
                    fill
                    className="object-cover opacity-20 mix-blend-multiply"
                  />
                  <div className="relative z-10 font-sans font-black text-xs uppercase tracking-widest text-[#121212]">
                    PODCAST
                  </div>
                  <div className="relative z-10 text-center my-auto">
                    <h4 className="font-sans font-black text-xl sm:text-2xl leading-none text-[#121212] uppercase tracking-tight">
                      {pod.coverTitle}
                    </h4>
                    <p className="font-sans text-[10px] font-bold text-[#444] mt-1">
                      {pod.coverAuthor}
                    </p>
                  </div>
                  <div className="relative z-10 flex justify-between items-center font-mono text-[9px] text-[#555]">
                    <span>LIVE 24 HOURS</span>
                    <span>•</span>
                  </div>
                </div>

                {/* Podcast Details */}
                <div className="sm:col-span-7 flex flex-col justify-between h-full py-1">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#121212] leading-snug mb-2">
                      {pod.title}
                    </h3>
                    <p className="font-sans text-xs text-[#555] font-medium mb-4">
                      by {pod.author} | {pod.duration}
                    </p>
                  </div>

                  {/* Play Button */}
                  <div>
                    <button
                      onClick={() => setPlayingEp(isPlaying ? null : pod.id)}
                      className="bg-[#121212] text-white text-xs font-mono font-bold px-4 py-2 rounded-sm hover:bg-[#333] transition-colors flex items-center gap-2 mb-4"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> PAUSE EPISODE
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> PLAY EPISODE
                        </>
                      )}
                    </button>

                    {/* Listen On Platforms */}
                    <div className="flex items-center gap-3 text-xs font-sans text-[#555]">
                      <span className="font-mono text-[11px] font-medium text-[#777]">
                        Listen on:
                      </span>
                      <div className="flex items-center gap-2 text-[#121212]">
                        <Radio className="w-4 h-4 hover:opacity-75 cursor-pointer" />
                        <Disc className="w-4 h-4 hover:opacity-75 cursor-pointer" />
                        <Mic className="w-4 h-4 hover:opacity-75 cursor-pointer" />
                        <Volume2 className="w-4 h-4 hover:opacity-75 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
