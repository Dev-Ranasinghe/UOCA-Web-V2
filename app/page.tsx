"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import AsciiEffectCanvas, { AsciiEffectConfig } from "@/components/AsciiEffectCanvas";
import NewsletterStamp from "@/components/NewsletterStamp";
import PresidentQuote from "@/components/PresidentQuote";
import WatchSection from "@/components/WatchSection";
import PodcastsSection from "@/components/PodcastsSection";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import Testimonials from "@/components/Testimonials";
import StackSpread from "@/components/ui/stack-spread";

const heroAsciiConfig: AsciiEffectConfig = {
  pfx: {
    bloom: { enabled: false, intensity: 25 },
    glitch: { enabled: false, intensity: 20 },
    filmDust: { enabled: false, intensity: 20 },
    halftone: { enabled: false, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    vignette: { enabled: false, intensity: 38 },
    chromatic: { enabled: false, intensity: 15 },
    filmGrain: { enabled: false, intensity: 30 },
    scanLines: { enabled: false, intensity: 40 },
  },
  mask: {
    tool: "freehand",
    invert: false,
    shapes: [],
    dataUrl: null,
    enabled: false,
    brushSize: 30,
    showOverlay: false,
  },
  tint: "#3ca6ff",
  bgBlur: 12,
  bgMode: "none",
  invert: false,
  lights: {
    points: [],
    enabled: false,
  },
  charSet: "standard",
  density: 20,
  animated: true,
  blurType: "off",
  cellSize: 9,
  contrast: 158,
  coverage: 100,
  animSpeed: { enabled: true, intensity: 100 },
  animStyle: "shimmer",
  bgOpacity: 90,
  blurAngle: 0,
  grayscale: 0,
  lensFocus: 40,
  tiltFocus: 35,
  toneCurve: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  blurAmount: 35,
  brightness: 0,
  renderMode: "dither",
  saturation: 100,
  styleBlend: "source-over",
  blurCenterX: 50,
  blurCenterY: 50,
  customChars: "",
  tiltFeather: 15,
  tintOpacity: 0,
  edgeEmphasis: 0,
  overlayBlend: "multiply",
  tiltPosition: 50,
  animIntensity: { enabled: true, intensity: 60 },
  progressiveReverse: false,
  progressivePosition: 55,
  directionalBothSides: false,
};

export default function HomePage() {
  const recentPosts = [
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
      id: "17",
      number: "017",
      category: "Food",
      author: "Ethan Miller",
      readTime: "6 min read",
      title: "Ten easy recipes for busy weeknight cooking",
    },
    {
      id: "14",
      number: "014",
      category: "Tech",
      author: "Emily Johnson",
      readTime: "6 min read",
      title: "Healthy habits that actually improve your sleep",
    },
    {
      id: "13",
      number: "013",
      category: "Business",
      author: "Jacob Anderson",
      readTime: "5 min read",
      title: "Simple strategies to improve your daily focus",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      {/* Navbar & Hero Banner */}
      <Navbar activePage="HOME" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-16">
        {/* Top Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Heading & Newsletter */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full pt-2">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#121212] leading-[1.05] mb-4">
                Passion Meets Purpose [UOCA]
              </h2>
              <p className="font-sans text-base text-[#444] leading-relaxed mb-6 font-normal">
                Discover stories, initiatives, and ideas that showcase how
                passionate Leos come together to serve communities, inspire
                change, and create lasting impact.
              </p>
            </div>

            <NewsletterStamp />
          </div>

          {/* Right Column: Featured Post Card [NO. 999] */}
          <div className="lg:col-span-7">
            <PostCard
              id="999"
              number="999"
              category="LEO"
              author="Michael Smith"
              readTime="7 min read"
              metaLabel="LEO DISTRICT 306 D1"
              metaMono
              title="Leo Club of Universities of Ceylon Alumni | Since 2016"
              featured={true}
              freeBadge={true}
              tag="HOLAAA"
              numberLabel="[DESIGNED BY DANDY STUDIOS]"
              customMedia={
                <AsciiEffectCanvas
                  src="/videos/elephant-4k.mp4"
                  config={heroAsciiConfig}
                  className="transition-[filter] duration-300 group-hover:grayscale"
                  style={{ transform: "scaleX(-1)" }}
                />
              }
            />
          </div>
        </section>
      </main>

      {/* Stack Spread */}
      <div className="my-8 sm:my-12">
        <StackSpread bgColor="#eae7e1" cardRadius={0} />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-24 sm:space-y-32">
        {/* Recent Posts Section */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
              Recent posts
            </h2>
            <Link
              href="/blog"
              className="bg-[#121212] text-white px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider hover:bg-[#333] transition-colors"
            >
              VIEW ALL POSTS
            </Link>
          </div>

          <SectionDivider className="mt-8 mb-8" />

          {/* 6-Grid Posts (3x2 Desktop, 2x3 Tablet, 1x6 Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </section>

        {/* Editor's Choice Section */}
        <section>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
            Editor&apos;s choice
          </h2>

          <SectionDivider className="mt-8 mb-8" />

          <div className="border border-[#121212] bg-[#f7f5f0] p-4 sm:p-5 rounded-sm">
            <div className="card-header-line mb-4">
              <span className="card-header-line-center"></span>
              <span className="text-xs font-mono text-[#444] font-semibold">
                [NO. 018]
              </span>
            </div>

            <div className="relative aspect-[21/9] w-full border border-[#121212] overflow-hidden group">
              <Image
                src="/images/elephant.png"
                alt="Editor's Choice Banner"
                fill
                className="object-cover transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                <span className="text-xs font-sans uppercase font-bold tracking-wider text-[#eee] mb-2 bg-[#121212]/80 px-2.5 py-1 rounded w-max">
                  Lifestyle
                </span>
                <h3 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold max-w-3xl leading-tight mb-2">
                  <Link href="/blog/18" className="hover:underline">
                    How remote work is reshaping modern lifestyles
                  </Link>
                </h3>
                <p className="font-sans text-xs sm:text-sm text-[#ccc] font-medium">
                  by Benjamin Scott | 7 min read
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Watch Section (Dark Theme Full Width) */}
      <WatchSection />

      {/* President Quote / Founder Feature */}
      <PresidentQuote />

      {/* Full-width Ad Banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 my-16 sm:my-24">
        <div className="relative aspect-[6/1] w-full border border-[#121212] overflow-hidden bg-[#222] rounded-sm group flex items-center justify-center">
          <Image
            src="/images/elephant.png"
            alt="Advertisement banner"
            fill
            className="object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute top-2 right-2 bg-black/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
            ADVERTISEMENT
          </div>
          <span className="relative z-10 font-serif text-2xl sm:text-4xl text-white font-bold tracking-wide drop-shadow-md">
            Save on premium membership
          </span>
        </div>
      </div>

      {/* Discover More Stories */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-24 sm:my-32">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#121212]">
          Discover more stories
        </h2>

        <SectionDivider className="mt-8 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (2 Stacked Cards) */}
          <div className="lg:col-span-4 space-y-6">
            <PostCard
              id="10"
              number="010"
              category="Finance"
              author="Benjamin Scott"
              readTime="4 min read"
              title="A guide to building stronger personal finances"
            />
            <PostCard
              id="9"
              number="009"
              category="Business"
              author="Sophia Harris"
              readTime="4 min read"
              title="Building meaningful careers in the digital age"
            />
          </div>

          {/* Center Column (Tall Center Story Card) */}
          <div className="lg:col-span-5 h-full">
            <PostCard
              id="8"
              number="008"
              category="Business"
              author="Michael Smith"
              readTime="4 min read"
              title="Exploring the intersection of technology and wellness"
              className="h-full"
            />
          </div>

          {/* Right Column (Text-only List & Ad Card) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border border-[#121212] bg-[#f7f5f0] p-4 rounded-sm space-y-4">
              <div className="border-b border-[#121212] pb-3">
                <h4 className="font-serif text-base font-bold text-[#121212] leading-snug">
                  <Link href="/blog/7" className="hover:underline">
                    How podcasts changed the way we learn
                  </Link>
                </h4>
                <p className="text-[11px] font-sans text-[#666] mt-1">
                  by Jacob Anderson | 4 min read
                </p>
              </div>

              <div className="border-b border-[#121212] pb-3">
                <h4 className="font-serif text-base font-bold text-[#121212] leading-snug">
                  <Link href="/blog/6" className="hover:underline">
                    How to create a realistic monthly budget plan
                  </Link>
                </h4>
                <p className="text-[11px] font-sans text-[#666] mt-1">
                  by William Parker | 4 min read
                </p>
              </div>

              <div>
                <h4 className="font-serif text-base font-bold text-[#121212] leading-snug">
                  <Link href="/blog/5" className="hover:underline">
                    Top exercises to strengthen your core and back
                  </Link>
                </h4>
                <p className="text-[11px] font-sans text-[#666] mt-1">
                  by Ethan Miller | 4 min read
                </p>
              </div>
            </div>

            {/* Square Ad Banner */}
            <div className="relative aspect-square w-full border border-[#121212] overflow-hidden bg-[#222] rounded-sm flex items-center justify-center p-4 text-center">
              <Image
                src="/images/elephant.png"
                alt="Ad banner"
                fill
                className="object-cover opacity-40 mix-blend-luminosity"
              />
              <div className="absolute top-2 right-2 bg-black/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
                ADVERTISEMENT
              </div>
              <span className="relative z-10 font-serif text-xl text-white font-bold leading-tight drop-shadow">
                Save on premium membership
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Podcasts Section */}
      <PodcastsSection />

      {/* Testimonials */}
      <Testimonials />

      {/* Footer */}
      <Footer />
    </div>
  );
}
