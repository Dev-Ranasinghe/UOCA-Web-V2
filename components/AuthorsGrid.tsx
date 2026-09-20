"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FaLinkedinIn, FaInstagram, FaWhatsapp } from "react-icons/fa6";

const INITIAL_VISIBLE = 12;

export type AuthorMember = {
  id: string;
  name: string;
  bio: string;
  image: string;
  socialLinks: { linkedin?: string; instagram?: string; whatsapp?: string } | null;
};

export function AuthorsGrid({ authors }: { authors: AuthorMember[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visibleAuthors = authors.slice(0, visibleCount);
  const hasMore = visibleCount < authors.length;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleAuthors.map((author) => (
          <div
            key={author.id}
            className="border border-[#121212] bg-[#f7f5f0] p-4 rounded-sm flex flex-col justify-between"
          >
            <div className="relative aspect-square w-full border border-[#121212] bg-[#e0ddd5] overflow-hidden mb-4 group">
              <Image
                src={author.image}
                alt={author.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-300"
              />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-[#121212] mb-1">{author.name}</h3>
              {author.bio ? (
                <p className="font-sans text-xs text-[#555] leading-relaxed mb-4">{author.bio}</p>
              ) : null}

              <div className="flex items-center gap-3 text-[#121212]">
                {author.socialLinks?.linkedin ? (
                  <a href={author.socialLinks.linkedin} aria-label="LinkedIn" className="hover:opacity-70">
                    <FaLinkedinIn className="w-3.5 h-3.5" />
                  </a>
                ) : null}
                {author.socialLinks?.instagram ? (
                  <a href={author.socialLinks.instagram} aria-label="Instagram" className="hover:opacity-70">
                    <FaInstagram className="w-3.5 h-3.5" />
                  </a>
                ) : null}
                {author.socialLinks?.whatsapp ? (
                  <a href={author.socialLinks.whatsapp} aria-label="WhatsApp" className="hover:opacity-70">
                    <FaWhatsapp className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount(authors.length)}
            className="bg-[#121212] text-white text-xs font-mono font-bold px-8 py-3 rounded-sm hover:bg-[#333] transition-colors tracking-widest uppercase"
          >
            LOAD MORE
          </button>
        </div>
      ) : null}
    </div>
  );
}
