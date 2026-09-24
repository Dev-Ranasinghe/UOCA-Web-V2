import Image from "next/image";
import Link from "next/link";
import { CircleArrowRight } from "lucide-react";

export interface CollageStat {
  value: string;
  label: string;
  description: string;
  /** Small black-and-white thumbnail beside the figure. */
  image: { src: string; alt: string };
  /** Thumbnail shape: square, or tall like a trophy shot. */
  tall?: boolean;
}

export interface StatsCollageProps {
  lead: { value: string; label: string; description: string };
  stats: CollageStat[];
  /** The main photo in the collage. */
  photo: { src: string; alt: string };
  /** The dark panel beside the main photo. */
  panel: { src: string; alt: string };
  /** Pinned note on the collage, one line per entry. */
  note?: string[];
  /** Small words down the side of the collage. */
  keywords?: string[];
  /** Where the circled arrow goes. */
  href?: string;
  /** Signature on the bottom strip. */
  signature?: string;
}

const INK = "#121212";
const LIME = "#c9d36a";

/** Fractal-noise texture as a data URI. `matrix` maps the noise to colour and alpha. */
function noise(frequency: number, matrix: string, octaves = 2) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' stitchTiles='stitch'/><feColorMatrix values='${matrix}'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
/** Pale blotches: worn ink on the big figure. */
const WORN = noise(0.16, "0 0 0 0 0.92  0 0 0 0 0.91  0 0 0 0 0.88  2.4 0 0 0 -1.5", 4);
/** Fine dark grain: newsprint over photos and paper blocks. */
const GRAIN = noise(0.85, "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 -0.18");
/** Lighter grain for coloured blocks, so the lime stays lime. */
const GRAIN_SOFT = noise(0.85, "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.32 -0.1");

/** Four-pointed star used as a full stop on rules. */
function Star({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-3.5 shrink-0 ${className}`} fill={INK}>
      <path d="M8 0 C8.6 5.2 10.8 7.4 16 8 C10.8 8.6 8.6 10.8 8 16 C7.4 10.8 5.2 8.6 0 8 C5.2 7.4 7.4 5.2 8 0Z" />
    </svg>
  );
}

/** A black-and-white photo with a grain layer, filling its parent. */
function Photo({ src, alt, sizes, position }: { src: string; alt: string; sizes: string; position?: string }) {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover grayscale contrast-[1.08]"
        style={{ objectPosition: position }}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-30" style={{ backgroundImage: GRAIN }} />
    </>
  );
}

/**
 * Stats Collage: an editorial "in numbers" spread. A worn, oversized lead figure; a paper-and-tape collage
 * built from real photos; a row of supporting figures with thumbnails; a signed strip underneath.
 * Server-rendered, no script. The page sets the outer spacing.
 */
export function StatsCollage({
  lead,
  stats,
  photo,
  panel,
  note = ["Same values.", "Bigger impact."],
  keywords = ["Community", "Leadership", "Impact"],
  href = "/projects",
  signature = "Leo Club of UOC Alumni",
}: StatsCollageProps) {
  return (
    <div className="text-[#121212]">
      {/* Kicker rule */}
      <div className="flex items-center gap-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.32em] sm:text-sm">UOCA in numbers</h2>
        <span aria-hidden="true" className="h-px w-16 bg-[#121212] sm:w-36" />
        <Star />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 md:mt-10 lg:grid-cols-12 lg:items-center lg:gap-8">
        {/* Lead figure */}
        <div className="lg:col-span-5">
          <div className="relative w-max">
            <p
              aria-hidden="true"
              className="font-serif font-bold leading-[0.8] tracking-[-0.04em] text-transparent select-none text-[clamp(7.5rem,30vw,11rem)] md:text-[12rem] lg:text-[clamp(10rem,15vw,14rem)]"
              style={{
                backgroundImage: `${WORN}, linear-gradient(${INK}, ${INK})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                backgroundSize: "360px 360px, 100% 100%",
              }}
            >
              {lead.value}
            </p>
            {/* Registration line through the foot of the figure */}
            <span aria-hidden="true" className="absolute top-[86%] -left-3 h-px w-2/5 bg-[#121212] sm:-left-6" />
          </div>
          <h3 className="relative mt-3 font-serif text-[clamp(2.5rem,10vw,3.5rem)] font-bold leading-[0.95] tracking-[-0.035em] md:text-6xl lg:text-[clamp(3rem,4.6vw,4.25rem)]">
            <span className="sr-only">{lead.value} </span>
            {lead.label}
          </h3>
          {/* Hand-drawn underline */}
          <svg aria-hidden="true" viewBox="0 0 480 30" className="mt-2 h-6 w-[88%] max-w-md" fill="none" stroke={INK} strokeLinecap="round">
            <path d="M3 18 C 110 9, 300 5, 474 7" strokeWidth="1.6" />
            <path d="M14 27 C 44 22, 80 19, 104 16 L 36 23" strokeWidth="1.3" />
          </svg>
          <p className="mt-5 max-w-sm font-mono text-sm leading-relaxed text-[#333] text-pretty">{lead.description}</p>
        </div>

        {/* Collage */}
        <div className="flex flex-col gap-6 lg:col-span-7 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative aspect-[16/11] w-full flex-1 sm:aspect-[16/10]">
            {/* Khaki texture patch, top */}
            <span
              aria-hidden="true"
              className="absolute top-0 left-[44%] h-[18%] w-[30%]"
              style={{ backgroundColor: "#8c7f5c", backgroundImage: GRAIN }}
            />
            {/* Lime block behind the note */}
            <span
              aria-hidden="true"
              className="absolute top-[17%] left-[3%] h-[46%] w-[16%] opacity-90"
              style={{ backgroundColor: LIME, backgroundImage: GRAIN_SOFT }}
            />
            {/* Grey paper behind the photo, peeking out below */}
            <span
              aria-hidden="true"
              className="absolute top-[20%] left-[16%] h-[80%] w-[54%] bg-[#bdb9b1]"
              style={{ backgroundImage: GRAIN }}
            />
            {/* Main photo */}
            <div className="absolute top-[14%] left-[4%] h-[72%] w-[58%] overflow-hidden border-[3px] border-[#f2f0eb] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.45)]">
              <Photo src={photo.src} alt={photo.alt} sizes="(min-width: 1024px) 34vw, 60vw" position="50% 60%" />
            </div>
            {/* Dark panel, right */}
            <div className="absolute top-[3%] left-[61%] h-[70%] w-[26%] overflow-hidden rounded-tr-[28%_14%] bg-[#1b1b1b] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.5)]">
              <Photo src={panel.src} alt={panel.alt} sizes="(min-width: 1024px) 16vw, 28vw" />
            </div>
            {/* Graph-paper grid */}
            <span
              aria-hidden="true"
              className="absolute top-0 right-[3%] h-[68%] w-[10%] opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(#121212 1px, transparent 1px), linear-gradient(90deg, #121212 1px, transparent 1px)",
                backgroundSize: "14px 14px",
                maskImage: "linear-gradient(to bottom, black 70%, transparent)",
              }}
            />
            {/* Lime stripes, lower right */}
            <span
              aria-hidden="true"
              className="absolute top-[74%] left-[72%] h-[20%] w-[6%]"
              style={{ backgroundImage: `repeating-linear-gradient(90deg, ${LIME} 0 2px, transparent 2px 4px)` }}
            />
            {/* Pinned note */}
            <div className="absolute top-[13%] left-[2%] w-[31%] max-w-[11rem] bg-[#eae7e1] px-2 py-1.5 font-mono text-[9px] leading-snug shadow-[0_4px_10px_-4px_rgba(0,0,0,0.3)] sm:px-3 sm:py-2.5 sm:text-xs">
              {note.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span aria-hidden="true" className="mt-1.5 block h-px w-4 bg-[#121212] sm:mt-2" />
            </div>
            {/* Scribbles */}
            <svg aria-hidden="true" viewBox="0 0 150 90" className="absolute top-[18%] right-0 w-[16%]" fill="none" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
              <path d="M2 80 L 146 4 L 30 58 L 138 22 L 16 86 L 120 50" />
            </svg>
            <svg aria-hidden="true" viewBox="0 0 200 100" className="absolute bottom-[1%] left-[44%] w-[20%]" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
              <path d="M4 92 L 190 8" />
              <path d="M26 98 L 196 26" strokeWidth="3" />
              <path d="M60 97 L 170 50" strokeWidth="2" />
            </svg>
          </div>

          {/* Side words */}
          <div className="flex items-center gap-4 lg:w-24 lg:flex-col lg:items-start lg:gap-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] lg:flex-col lg:gap-1">
              {keywords.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
            <Link
              href={href}
              aria-label="See our projects"
              className="ml-auto rounded-full transition-transform hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] lg:ml-0"
            >
              <CircleArrowRight aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="mt-12 h-px bg-[#121212]/40 md:mt-16" />

      {/* Supporting figures */}
      <ul className="grid grid-cols-1 md:grid-cols-3">
        {stats.map((stat, i) => (
          <li
            key={stat.label}
            className={`flex gap-5 py-8 md:flex-col md:gap-4 md:px-6 md:py-10 lg:flex-row lg:gap-8 lg:px-8 ${
              i > 0 ? "border-t border-[#121212]/40 md:border-t-0 md:border-l" : "md:pl-0 lg:pl-0"
            }`}
          >
            {/* Thumbnail on a lime tab */}
            <div className={`relative shrink-0 ${stat.tall ? "h-24 w-16 md:h-28 md:w-[4.5rem]" : "h-20 w-20 md:h-24 md:w-24"}`}>
              <span
                aria-hidden="true"
                className="absolute -bottom-2 -left-2 h-2/3 w-2/3"
                style={{ backgroundColor: LIME, backgroundImage: GRAIN_SOFT }}
              />
              <div className="absolute inset-0 overflow-hidden">
                <Photo src={stat.image.src} alt={stat.image.alt} sizes="96px" />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-serif text-5xl font-bold leading-none tracking-[-0.03em] md:text-6xl">{stat.value}</p>
              <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.2em]">{stat.label}</p>
              <div className="mt-3 flex items-end gap-4">
                <p className="max-w-[16rem] font-mono text-xs leading-relaxed text-[#333] text-pretty">{stat.description}</p>
                <span aria-hidden="true" className="mb-2 ml-auto hidden h-px w-5 shrink-0 bg-[#121212] lg:block" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Signed strip */}
      <div aria-hidden="true" className="mt-4 flex items-center gap-4 md:mt-8">
        <span
          className="h-5 w-24 shrink-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #121212 0 2px, transparent 2px 3px, #121212 3px 4px, transparent 4px 6px, #121212 6px 9px, transparent 9px 10px)",
          }}
        />
        <span className="h-px flex-1 bg-[#121212]/40" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">{signature}</span>
        <span className="hidden h-px w-12 bg-[#121212]/40 sm:block" />
        <Star className="hidden sm:block" />
      </div>
    </div>
  );
}

export default StatsCollage;
