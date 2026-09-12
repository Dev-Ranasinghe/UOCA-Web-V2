"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import Footer from "@/components/Footer";

export default function BlogPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const categories = [
    "ALL",
    "FINANCE",
    "HEALTH",
    "BUSINESS",
    "FOOD",
    "TRAVEL",
    "LIFESTYLE",
    "TECH",
  ];

  const allPosts = [
    {
      id: "22",
      number: "022",
      category: "Tech",
      author: "Emily Johnson",
      readTime: "7 min read",
      title: "How e-commerce is redefining global shopping trends",
    },
    {
      id: "21",
      number: "021",
      category: "Lifestyle",
      author: "Jacob Anderson",
      readTime: "6 min read",
      title: "Exploring minimalist living: a beginner's perspective",
    },
    {
      id: "20",
      number: "020",
      category: "Travel",
      author: "Sophia Harris",
      readTime: "5 min read",
      title: "Five underrated destinations for your next holiday",
    },
    {
      id: "999",
      number: "999",
      category: "Tech",
      author: "Michael Smith",
      readTime: "7 min read",
      title: "Leo Club of Universities of Ceylon Alumni | Since 2016",
    },
    {
      id: "18",
      number: "018",
      category: "Lifestyle",
      author: "Benjamin Scott",
      readTime: "7 min read",
      title: "How remote work is reshaping modern lifestyles",
    },
    {
      id: "17",
      number: "017",
      category: "Food",
      author: "Ethan Miller",
      readTime: "6 min read",
      title: "Ten easy recipes for busy weeknight cooking",
    },
    {
      id: "16",
      number: "016",
      category: "Health",
      author: "William Parker",
      readTime: "6 min read",
      title: "Quick fitness routines you can do anywhere",
    },
    {
      id: "15",
      number: "015",
      category: "Tech",
      author: "Jacob Anderson",
      readTime: "6 min read",
      title: "The future of electric cars explained simply",
    },
    {
      id: "14",
      number: "014",
      category: "Tech",
      author: "Emily Johnson",
      readTime: "6 min read",
      title: "Healthy habits that actually improve your sleep",
    },
  ];

  const filteredPosts =
    activeFilter === "ALL"
      ? allPosts
      : allPosts.filter(
          (p) => p.category.toUpperCase() === activeFilter.toUpperCase()
        );

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="BLOG" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center my-8">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#121212]">
            Blog
          </h1>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-12">
          {categories.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-sm border border-[#121212] transition-colors ${
                  isActive
                    ? "bg-[#121212] text-white"
                    : "bg-[#f7f5f0] text-[#121212] hover:bg-[#dfdcd5]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center my-8">
          <button className="bg-[#121212] text-white text-xs font-mono font-bold px-8 py-3 rounded-sm hover:bg-[#333] transition-colors tracking-widest uppercase">
            LOAD MORE
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
