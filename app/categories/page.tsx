"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CategoriesPage() {
  const categoriesList = [
    {
      title: "Finance",
      slug: "finance",
      description:
        "Smart tips on money management, investments, and achieving financial freedom.",
    },
    {
      title: "Health",
      slug: "health",
      description:
        "Guides and advice for maintaining physical, mental, and emotional well-being.",
    },
    {
      title: "Business",
      slug: "business",
      description:
        "Insights, strategies, and success stories for entrepreneurs and growing brands.",
    },
    {
      title: "Food",
      slug: "food",
      description:
        "Delicious ideas, recipes, and culinary experiences to satisfy every craving.",
    },
    {
      title: "Travel",
      slug: "travel",
      description:
        "Discover destinations, travel hacks, and stories that spark your next adventure.",
    },
    {
      title: "Lifestyle",
      slug: "lifestyle",
      description:
        "Inspiration for better living — from habits and productivity to home and wellness tips.",
    },
    {
      title: "Tech",
      slug: "tech",
      description:
        "Explore the latest innovations, digital trends, and tools shaping the future of technology.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="CATEGORIES" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center my-8">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212]">
            Categories
          </h1>
        </div>

        {/* 2-Column Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          {categoriesList.map((cat) => (
            <Link
              key={cat.title}
              href={`/blog?category=${cat.slug}`}
              className="border border-[#121212] bg-[#f7f5f0] p-4 rounded-sm flex flex-col sm:flex-row gap-5 items-center hover:shadow-md transition-shadow group"
            >
              {/* Category Thumbnail */}
              <div className="relative w-full sm:w-48 aspect-[4/3] border border-[#121212] bg-[#e0ddd5] overflow-hidden flex-shrink-0">
                <Image
                  src="/images/elephant.png"
                  alt={cat.title}
                  fill
                  className="object-cover transition-transform duration-300"
                />
              </div>

              {/* Category Content */}
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#121212] mb-2 group-hover:underline">
                  {cat.title}
                </h3>
                <p className="font-sans text-xs text-[#555] leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center my-12 font-mono text-xs text-[#777] uppercase tracking-widest">
          THAT&apos;S EVERYTHING FOR NOW!
        </div>
      </main>

      <Footer />
    </div>
  );
}
