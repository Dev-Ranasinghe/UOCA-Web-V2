import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import AsciiEffectCanvas, { AsciiEffectConfig } from "@/components/AsciiEffectCanvas";
import NewsletterStamp from "@/components/NewsletterStamp";
import Ticker from "@/components/Ticker";
import WatchSection from "@/components/WatchSection";
import HappeningNowSection from "@/components/HappeningNowSection";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import Testimonials from "@/components/Testimonials";
import FaqSection from "@/components/FaqSection";
import CommunityFloating from "@/components/CommunityFloating";
import StackSpread from "@/components/ui/stack-spread";
import { FilmstripGallery, type FilmstripImage } from "@/components/ui/filmstrip-gallery";
import { FilmEdge } from "@/components/ui/film-edge";
import { StatsCollage } from "@/components/ui/stats-collage";
import { prisma } from "@/lib/prisma";
import { getHappeningNow } from "@/lib/happening-now";

// Photographs from the club's own roll (LC UOCA Site/Dump Pics), resized into public/images/gallery:
// "-sm" files feed the strip, the full files open as the print.
const g = (name: string) => ({ src: `/images/gallery/${name}.jpg`, thumb: `/images/gallery/${name}-sm.jpg` });
const galleryImages: FilmstripImage[] = [
  { ...g("dsc04463"), alt: "Four Leos in black suits and blue ties, smiling under a tree", caption: "Four ties, one colour" },
  { ...g("dsc04282"), alt: "Members chatting and laughing around an outdoor table, one checking a phone", caption: "Waiting for the photographer" },
  { ...g("dsc04304"), alt: "A Leo in a blue saree and a Leo in a black shirt posing on a wet road", caption: "After the rain, before the photos" },
  { ...g("dsc04323"), alt: "Three members seen from behind, arms linked at the waist", caption: "Arm in arm, backs to the camera" },
  { ...g("dsc04343"), alt: "Members in blue sarees laughing as one hides her face under her saree", caption: "One of us was not ready" },
  { ...g("dsc04377"), alt: "Three members in suits clowning around a small signpost at the foot of a tree", caption: "Thumbs up at the signpost" },
  { ...g("dsc04389"), alt: "A member in a blue saree kneels to offer a leaf to another, a colonnaded hall behind them", caption: "A leaf, offered on one knee" },
  { ...g("dsc04370"), alt: "One member in a suit carrying another in his arms across a wet road", caption: "Carried off set" },
  { ...g("dsc04395"), alt: "Members in suits laughing and pretending to push a friend into a pond", caption: "Nobody went in. Nearly." },
  { ...g("dsc04409"), alt: "Nine members in matching blue sarees standing in a row under the trees", caption: "Nine sarees, one blue" },
  { ...g("dsc04344"), alt: "A group in blue sarees stands behind members crouching in hoodies and suits", caption: "The whole crew, hoods up" },
  { ...g("dsc04411"), alt: "A member in a pin-covered black blazer looks down and smiles", caption: "Every pin a story" },
  { ...g("dsc04418"), alt: "Members gathered in a circle on a wet road, one holding an umbrella", caption: "The huddle before the shoot" },
  { ...g("dsc04406"), alt: "Four members pulling faces and striking poses on a path beside a pond", caption: "Serious photo, attempt four" },
  { ...g("dsc04430"), alt: "Two members in grey suits with hands pressed together as if praying", caption: "Please, one more take", position: "50% 22%" },
  { ...g("dsc04523"), alt: "Six members standing together on the grass, one crouching in front", caption: "Six, and one crouching" },
  { ...g("dsc04299"), alt: "Four Leos in black suits standing together under the trees", caption: "Same four, last frame" },
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
  const [recentProjects, happeningNow] = await Promise.all([
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      include: { coverImage: true, chairperson: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    getHappeningNow(6),
  ]);

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

        {/* Second text strip, centred in the gap under the hero. This wrapper is zero height with no margin of its own and
            the strip floats inside the gap, so the Impact section below keeps exactly the position and height it had. */}
        <div className="relative h-0" style={{ marginTop: 0 }}>
          <div className="absolute inset-x-0 top-[calc(var(--section-gap)/2)] -translate-y-1/2">
            <Ticker
              items={["Leoistic Year 2026/27", "Under the Presidency of Leo Sasun Wijeratne", "Passion Meets Purpose"]}
              label="Leoistic Year 2026/27, under the presidency of Leo Sasun Wijeratne, Passion Meets Purpose"
              reverse
            />
          </div>
        </div>

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

        {/* Projects happening right now (six cards, this month's projects) */}
        <HappeningNowSection items={happeningNow} />
      </>

      {/* Behind the scenes: the team's photos on an endless, self-advancing film strip (dark, full width) */}
      <section className="section-dark relative w-full bg-black text-white">
        {/* Film-roll rims where the section meets the light ones above and below; the page shows through the holes. */}
        <FilmEdge side="top" />
        <FilmEdge side="bottom" />
        <div className="page-container">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="mb-4 font-mono text-xs font-bold tracking-wider text-[#a3a3a3]">[BEHIND THE SCENES]</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance text-white">
              Caught between takes
            </h2>
            <p className="mt-4 max-w-lg font-sans text-base text-pretty text-[#bdbdbd]">
              The frames that never made the official album: the huddles, the retakes and one near miss by the pond.
            </p>
          </div>

          <SectionDivider dark spaced />

          <FilmstripGallery
            images={galleryImages}
            defaultIndex={6}
            aria-label="Behind-the-scenes photographs of the team"
            frameWidth="clamp(200px, 58vw, 300px)"
            aspect="3 / 2"
            speed={0.75}
            film="UOCA · 35MM · ISO 400"
            stripColor="#1c1916"
            inkColor="#eae7e1"
            gateColor="#ef671c"
            holeColor="#000000"
          />
        </div>
      </section>

      {/* UOCA in numbers: editorial collage. Placeholder figures and thumbnails until the real ones are confirmed. */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StatsCollage
          lead={{
            value: "10+",
            label: "Years of Service",
            description: "A decade of Leos turning shared passion into projects that outlast a single term.",
          }}
          photo={{ src: "/images/stats-group.jpg", alt: "Club members in sarees and suits gathered on a wet road, one holding an umbrella" }}
          panel={{ src: "/images/impact/club-medal.webp", alt: "The club's 2026/27 presidential medal" }}
          stats={[
            {
              value: "120+",
              label: "Projects",
              description: "Ideas in action. From local initiatives to lasting impact.",
              image: { src: "/images/impact/lamp-lighting.webp", alt: "Lighting the traditional oil lamp at a club event" },
            },
            {
              value: "25",
              label: "Awards",
              description: "Recognised for our commitment to service and excellence.",
              image: { src: "/images/impact/runners-up.webp", alt: "Members receiving a runners-up award on stage" },
              tall: true,
            },
            {
              value: "40",
              label: "Members",
              description: "A diverse team united by one purpose.",
              image: { src: "/images/impact/members.webp", alt: "Two members in suits and blue ties" },
            },
          ]}
        />
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

      {/* FAQ (dark, animated Auralis background) */}
      <FaqSection />

      {/* Testimonials */}
      <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
