"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaLinkedinIn, FaInstagram, FaWhatsapp } from "react-icons/fa6";

const INITIAL_VISIBLE = 12;

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  category: string;
  image: string;
  socialLinks: { linkedin?: string; instagram?: string; whatsapp?: string } | null;
};

export function TeamGrid({ members }: { members: TeamMember[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visibleMembers = members.slice(0, visibleCount);
  const hasMore = visibleCount < members.length;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {visibleMembers.map((member) => (
          <article
            key={member.id}
            className="group border border-[#121212] bg-[#f7f5f0] p-3.5 sm:p-6 lg:p-8 rounded-none flex flex-col justify-between transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-6 lg:mb-8 font-mono text-[11px] sm:text-xs text-[#121212]">
              <span className="tracking-[2px] font-semibold">ooo</span>
              <div className="flex-1 border-b border-dashed border-[#121212]"></div>
              <span className="tracking-[2px] font-semibold">[{member.category}]</span>
            </div>

            <div className="relative aspect-square w-full border border-[#121212] bg-[#e0ddd5] overflow-hidden mb-4 sm:mb-6 lg:mb-10">
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover filter group-hover:grayscale transition-all duration-300"
              />
            </div>

            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#121212] leading-[1.75rem] sm:leading-[2rem] min-h-[3.5rem] lg:min-h-0 mb-1 sm:mb-2">
                <span className="highlight-text-on-hover">{member.name}</span>
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#555] leading-relaxed mb-4 sm:mb-6 lg:mb-10">
                <span className="highlight-text-on-hover">{member.role}</span>
              </p>

              <div className="flex items-center gap-3 sm:gap-4 text-[#121212]">
                {member.socialLinks?.linkedin ? (
                  <a href={member.socialLinks.linkedin} aria-label="LinkedIn" className="hover:opacity-70">
                    <FaLinkedinIn className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </a>
                ) : (
                  <span aria-hidden="true">
                    <FaLinkedinIn className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </span>
                )}
                {member.socialLinks?.instagram ? (
                  <a href={member.socialLinks.instagram} aria-label="Instagram" className="hover:opacity-70">
                    <FaInstagram className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </a>
                ) : (
                  <span aria-hidden="true">
                    <FaInstagram className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </span>
                )}
                {member.socialLinks?.whatsapp ? (
                  <a href={member.socialLinks.whatsapp} aria-label="WhatsApp" className="hover:opacity-70">
                    <FaWhatsapp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </a>
                ) : (
                  <span aria-hidden="true">
                    <FaWhatsapp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount(members.length)}
            className="bg-[#121212] text-white text-xs font-mono font-bold px-8 py-3 rounded-sm hover:bg-[#333] transition-colors tracking-widest uppercase"
          >
            LOAD MORE
          </button>
        </div>
      ) : null}
    </div>
  );
}
