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
import FaqSection from "@/components/FaqSection";
import CommunityFloating from "@/components/CommunityFloating";
import StackSpread from "@/components/ui/stack-spread";
import { HaloReel, type HaloReelItem } from "@/components/ui/halo-reel";
import MarqueeAlongSvgPath from "@/components/ui/marquee-along-svg-path";
import { prisma } from "@/lib/prisma";

// Placeholder images until real community photos are ready.
// Square crops (w=h) so each tile renders as a square, matching the
// component's original reference demo.
const marqueeImages = [
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=400&h=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=400&h=400&auto=format&fit=crop",
];

const marqueePath =
  "M1 209.434C58.5872 255.935 387.926 325.938 482.583 209.434C600.905 63.8051 525.516 -43.2211 427.332 19.9613C329.149 83.1436 352.902 242.723 515.041 267.302C644.752 286.966 943.56 181.94 995 156.5";

// Placeholder banner until real flyer artwork for each project is ready —
// swap `src` in each entry for the actual flyer image once available.
const currentProjects: HaloReelItem[] = [
  { src: "/images/elephant-card.webp", alt: "Blood Drive" },
  { src: "/images/elephant-card.webp", alt: "Beach Cleanup" },
  { src: "/images/elephant-card.webp", alt: "Tech For Good" },
  { src: "/images/elephant-card.webp", alt: "Fellowship Night" },
  { src: "/images/elephant-card.webp", alt: "Outreach Camp" },
  { src: "/images/elephant-card.webp", alt: "Global Partners" },
];

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

// These pages read the database but were prerendered once at build time, so a project or member added in the admin never
// showed up until the next deploy. Statically served, refreshed in the background at most once a minute.
export const revalidate = 60;

export default async function HomePage() {
  const recentProjects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    include: { coverImage: true, chairperson: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      {/* Navbar & Hero Banner */}
      <Navbar activePage="HOME" />

      {/* Main Content Area */}
      <main className="section-stack flex-1 w-full pt-6 md:pt-[calc(var(--section-gap)/2)]">
        {/* Top Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-7 md:gap-8 items-stretch">
          {/* Left Column: Heading & Newsletter */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full md:pt-2">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#121212] leading-[1.05] mb-5 md:mb-4">
                Passion Meets Purpose [UOCA]
              </h2>
              <p className="font-sans text-base text-[#444] leading-[1.2] md:leading-relaxed mb-0 md:mb-6 font-normal">
                Discover stories, initiatives, and ideas that showcase how
                passionate Leos come together to serve communities, inspire
                change, and create lasting impact.
              </p>
            </div>

            <NewsletterStamp className="lg:mb-0" />
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
              className="h-full"
              tag="HOLAAA"
              numberLabel="[DESIGNED BY DANDY STUDIOS]"
              customMedia={
                <AsciiEffectCanvas
                  src="/videos/elephant-hero.mp4"
                  config={heroAsciiConfig}
                  className="transition-[filter] duration-300 group-hover:grayscale"
                  style={{ transform: "scaleX(-1)" }}
                />
              }
            />
          </div>
        </section>

      {/* Stack Spread */}
      <div data-reveal="none">
        <StackSpread bgColor="#eae7e1" cardRadius={0} />
      </div>

      {/* Meet the backbone of UOCA */}
      <CommunityFloating />

      <>
        {/* Recent Project Updates Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
              Recent project updates
            </h2>
            <Link
              href="/projects"
              className="bg-[#121212] text-white px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider hover:bg-[#333] transition-colors"
            >
              VIEW ALL PROJECTS
            </Link>
          </div>

          <SectionDivider spaced />

          {/* 6-Grid Posts (3x2 Desktop, 2x3 Tablet and Mobile; tighter gap on mobile) */}
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3">
            {recentProjects.map((project, index) => (
              <PostCard
                key={project.id}
                compact
                href={`/projects/${project.slug}`}
                number={String(index + 1).padStart(3, "0")}
                category={
                  project.startDate
                    ? project.startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "Project"
                }
                metaLabel={project.chairperson ? `Chair: ${project.chairperson.displayName}` : ""}
                author=""
                readTime=""
                title={project.name}
                description={project.shortDescription}
                imageUrl={project.coverImage?.url}
              />
            ))}
          </div>
        </section>

        {/* Current Projects Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
            Happening right now
          </h2>

          <SectionDivider spaced />

          <HaloReel
            items={currentProjects}
            aria-label="Current club projects"
            centerLabel={
              <span className="font-serif text-[3vw] sm:text-[2.4vw] lg:text-[1.8vw] font-bold tracking-tight text-[#121212]">
                Our projects
              </span>
            }
            cardWidth={170}
            cardHeight={235}
            minScale={0.4}
            radiusYRatio={0.36}
            centerXRatio={0.035}
            holdDuration={1000}
            stepDuration={700}
            className="h-[560px]"
          />
        </section>
      </>

      {/* Community Spotlight Section (Dark Theme Full Width, Placeholder) */}
      <section className="section-dark w-full bg-black border-t border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white text-center">
            [Placeholder Section Title]
          </h2>
        </div>

        <div className="w-full h-[320px] sm:h-[420px] mt-10 overflow-hidden">
          <MarqueeAlongSvgPath
            path={marqueePath}
            viewBox="0 0 996 330"
            baseVelocity={8}
            slowdownOnHover
            draggable
            repeat={2}
            dragSensitivity={0.1}
            className="w-full h-full scale-105"
            responsive
            grabCursor
          >
            {marqueeImages.map((src, i) => (
              <div
                key={i}
                className="w-14 h-full hover:scale-150 duration-300 ease-in-out"
              >
                <img
                  src={src}
                  alt={`Community highlight ${i + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </MarqueeAlongSvgPath>
        </div>
      </section>

      <>
        {/* Editor's Choice Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
            Editor&apos;s choice
          </h2>

          <SectionDivider spaced />

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
                sizes="(min-width: 1280px) 1216px, 100vw"
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
      </>

      {/* Watch Section (Dark Theme Full Width) */}
      <WatchSection />

      {/* President Quote / Founder Feature */}
      <PresidentQuote />

      {/* Full-width Ad Banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative aspect-[6/1] w-full border border-[#121212] overflow-hidden bg-[#222] rounded-sm group flex items-center justify-center">
          <Image
            src="/images/elephant.png"
            alt="Advertisement banner"
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
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
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#121212]">
          Discover more stories
        </h2>

        <SectionDivider spaced />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-start">
          {/* Left Column (2 Stacked Cards) */}
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:block lg:space-y-6 lg:col-span-4">
            <PostCard
              compact
              id="10"
              number="010"
              category="Finance"
              author="Benjamin Scott"
              readTime="4 min read"
              title="A guide to building stronger personal finances"
            />
            <PostCard
              compact
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
              compact
              compactUntil="md"
              id="8"
              number="008"
              category="Business"
              author="Michael Smith"
              readTime="4 min read"
              title="Exploring the intersection of technology and wellness"
              mediaAspectClass="aspect-[16/9] lg:aspect-[4/3]"
              className="h-full"
            />
          </div>

          {/* Right Column (Text-only List & Ad Card) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-1 lg:col-span-3">
            <div className="space-y-4 md:border md:border-[#121212] md:bg-[#f7f5f0] md:p-4 md:rounded-sm">
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

              <div className="border-b border-[#121212] pb-3 md:border-b-0 md:pb-0">
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
            <div className="relative aspect-[8/5] w-full border border-[#121212] overflow-hidden bg-[#222] rounded-sm flex items-center justify-center p-4 text-center md:aspect-square">
              <Image
                src="/images/elephant.png"
                alt="Ad banner"
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
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

      {/* FAQ (dark, animated Auralis background) */}
      <FaqSection />

      {/* Testimonials */}
      <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
