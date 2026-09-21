import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import type { HappeningItem } from "@/lib/happening-now";

/**
 * The projects running this month, six cards. This is the old Podcasts section's card (same frame, header line and a square
 * cover taking half the card, details on the right), with the corner radius removed and the play button turned into a
 * "View project" link. Cover left / details right holds from phone up, so six cards stay compact on a phone; two columns
 * from tablet. The whole card is the link (stretched from the button).
 */
export default function HappeningNowSection({ items }: { items: HappeningItem[] }) {
  return (
    <section aria-labelledby="happening-now-title" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 id="happening-now-title" className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
        Projects happening right now
      </h2>

      <SectionDivider spaced />

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
        {items.map((item) => (
          <li key={item.key}>
            <article className="group relative flex h-full flex-col justify-between border border-[#121212] bg-[#f7f5f0] p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#121212] sm:p-5">
              {/* Header dotted line */}
              <div className="card-header-line mb-3 sm:mb-4">
                <span className="card-header-line-center"></span>
                <span className="text-xs font-mono text-[#444] font-semibold">[NO. {item.number}]</span>
              </div>

              <div className="grid flex-1 grid-cols-12 items-center gap-3 sm:gap-5">
                {/* Cover: the podcast card's square, widened from 5 to 6 of 12 columns */}
                <div className="relative col-span-6 aspect-square overflow-hidden border border-[#121212] bg-[#e0ddd5]">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 280px, (min-width: 768px) 24vw, 46vw"
                    className="object-cover object-center transition-[filter] duration-300 group-hover:grayscale"
                  />
                </div>

                {/* Details */}
                <div className="col-span-6 flex h-full flex-col justify-between gap-3 py-1">
                  <div>
                    <h3 className="mb-1.5 font-serif text-base font-semibold leading-snug text-[#121212] sm:mb-2 sm:text-xl md:text-lg lg:text-2xl">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs font-medium leading-relaxed text-[#555]">{item.meta}</p>
                  </div>

                  <Link
                    href={item.href}
                    className="flex w-fit items-center gap-2 rounded-none bg-[#121212] px-3 py-2 font-mono text-[11px] font-bold text-white outline-none transition-colors after:absolute after:inset-0 hover:bg-[#333] sm:px-4 sm:text-xs"
                  >
                    VIEW PROJECT <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">: {item.title}</span>
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
