"use client";

import { Check } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import { cn } from "@/lib/utils";

type RailSection = { id: string; title: string };

/** The Membership Chairperson's sign-off, from the original form's introduction. */
export function ChairNote({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="font-serif text-xl font-bold leading-snug text-[#121212]">
        Let&apos;s serve. Let&apos;s lead. Let&apos;s grow together.
      </p>
      <p className="mt-3 font-sans text-sm font-semibold text-[#121212]">Leo Imasha Kumarasiri</p>
      <p className="font-sans text-sm text-[#555]">Membership Chairperson | 2026/2027</p>
      <p className="font-sans text-sm text-[#555]">Leo District 306 D1 | Sri Lanka</p>
    </div>
  );
}

/**
 * Sticky index for wide screens: which sections are finished and which one you're reading.
 * Anchor links are hash-only, so the page curtain leaves them alone.
 */
export default function SectionRail({
  sections,
  completeIds,
  activeId,
}: {
  sections: readonly RailSection[];
  completeIds: ReadonlySet<string>;
  activeId: string;
}) {
  return (
    <aside aria-label="Application progress" className="hidden lg:block">
      <div className="sticky top-28">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[2px] text-[#555]" aria-live="polite">
          {completeIds.size} of {sections.length} sections complete
        </p>

        <ol className="mt-4 flex flex-col gap-1">
          {sections.map((section) => {
            const done = completeIds.has(section.id);
            const active = section.id === activeId;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active ? "location" : undefined}
                  className="group flex items-center gap-3 py-1.5 font-sans text-base text-[#121212] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-200",
                      done ? "border-[#121212] bg-[#121212] text-white" : "border-[#767676] text-transparent",
                    )}
                  >
                    <Check strokeWidth={3} className="size-3" />
                  </span>
                  <span
                    className={cn(
                      "box-decoration-clone px-1 transition-colors duration-200",
                      active ? "bg-[#f3c276] font-semibold" : "group-hover:underline group-hover:underline-offset-4",
                    )}
                  >
                    {section.title}
                    {done ? <span className="sr-only"> (complete)</span> : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>

        <SectionDivider className="my-6" />
        <ChairNote />
      </div>
    </aside>
  );
}
