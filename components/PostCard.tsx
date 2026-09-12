"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

interface PostCardProps {
  id?: string;
  number: string;
  category: string;
  author: string;
  readTime: string;
  title: string;
  imageUrl?: string;
  freeBadge?: boolean;
  featured?: boolean;
  horizontal?: boolean;
  className?: string;
  customMedia?: React.ReactNode;
  /** optional centered label shown between the two dashed header lines */
  tag?: string;
  /** overrides the "[NO. xxx]" text at the end of the header line */
  numberLabel?: string;
  /** overrides the "by {author} | {readTime}" metadata text */
  metaLabel?: string;
  /** renders the category/meta line in font-mono (matching the header line's tag) instead of font-sans */
  metaMono?: boolean;
}

export default function PostCard({
  id = "1",
  number,
  category,
  author,
  readTime,
  title,
  imageUrl = "/images/elephant.png",
  freeBadge = false,
  featured = false,
  horizontal = false,
  className = "",
  customMedia,
  tag,
  numberLabel,
  metaLabel,
  metaMono = false,
}: PostCardProps) {
  // Ensure category is in sentence case (e.g. "Lifestyle", "Tech", "Food")
  const formattedCategory =
    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  return (
    <article
      className={`group border border-[#121212] bg-[#eae7e1] p-3.5 sm:p-4 rounded-none flex flex-col justify-between transition-all duration-200 hover:shadow-sm cursor-pointer ${className}`}
    >
      {/* Top Header Row with ooo, dashed line, and [NO. xxx] */}
      <div className="flex items-center gap-2 mb-3 font-mono text-[11px] sm:text-xs text-[#121212]">
        <span className="tracking-[2px] font-semibold">ooo</span>
        <div className="flex-1 border-b border-dashed border-[#121212]"></div>
        {tag ? (
          <>
            <span className="font-normal text-[#222] uppercase tracking-wide">
              {tag}
            </span>
            <div className="flex-1 border-b border-dashed border-[#121212]"></div>
          </>
        ) : null}
        <span className="font-normal text-[#222]">
          {numberLabel ?? `[NO. ${number}]`}
        </span>
      </div>

      {/* Image Container with Crisp 1px Black Border */}
      <div className="relative w-full aspect-[4/3] bg-[#e0ddd5] border border-[#121212] overflow-hidden mb-3.5">
        {customMedia ?? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center filter group-hover:grayscale transition-all duration-300"
          />
        )}

        {freeBadge && (
          <div className="absolute bottom-3 right-3 bg-white text-[#121212] text-xs font-sans font-bold px-3 py-1.5 rounded-sm shadow-md border border-[#121212] flex items-center gap-1.5">
            <span>Get it for FREE</span>
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Metadata & Title Container */}
      <div className="flex flex-col flex-1 justify-between">
        {/* Metadata Line: Category left, Author & Read time right */}
        <div
          className={`flex items-center justify-between text-xs sm:text-[13px] text-[#222] mb-2 font-normal ${
            metaMono ? "font-mono" : "font-sans"
          }`}
        >
          <span className="text-[#121212] font-normal">{formattedCategory}</span>
          <span className="text-[#333]">
            {metaLabel ?? (
              <>
                by {author} <span className="mx-1 text-[#888]">|</span> {readTime}
              </>
            )}
          </span>
        </div>

        {/* Title: Serif Regular/Medium weight with yellow highlight on hover */}
        <h3
          className={`font-serif text-[#121212] font-normal leading-[1.5] tracking-tight ${
            featured
              ? "text-2xl sm:text-3xl font-medium"
              : "text-xl sm:text-[22px] md:text-2xl"
          }`}
        >
          <Link href={`/blog/${id}`} className="inline">
            <span className="highlight-text-on-hover">{title}</span>
          </Link>
        </h3>
      </div>
    </article>
  );
}


