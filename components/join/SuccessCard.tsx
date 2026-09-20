"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Shown in place of the form once the application is saved. Takes focus so screen readers announce it. */
export default function SuccessCard({ reference }: { reference: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  return (
    <section aria-labelledby="application-received" className="mx-auto w-full max-w-3xl">
      <div className="stamp-container rounded-sm px-6 py-10 text-center sm:px-14 sm:py-14">
        {/* A rubber stamp landing on the page: the one moment of motion on this screen. */}
        <div aria-hidden="true" className="stamp-thump mb-8 inline-block border-2 border-[#c2470f] p-1 text-[#c2470f]">
          <div className="border border-[#c2470f] px-5 py-1.5 font-mono text-sm font-semibold uppercase tracking-[0.3em]">
            Received
          </div>
        </div>

        <h2
          id="application-received"
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-4xl font-bold text-[#121212] outline-none sm:text-5xl"
        >
          Application Received
        </h2>
        <p className="mx-auto mt-4 max-w-md font-sans text-base leading-relaxed text-[#333] sm:text-lg">
          Thank you for your interest in joining the Leo Club of UOC Alumni.
        </p>
        <p className="mx-auto mt-3 max-w-md font-sans text-base leading-relaxed text-[#333] sm:text-lg">
          We&apos;ve received your application and a member of our team will get in touch with you soon.
        </p>

        <dl className="mx-auto mt-8 flex max-w-xs items-baseline justify-between gap-4 border-y border-dashed border-[#121212]/40 py-3">
          <dt className="font-mono text-[11px] uppercase tracking-[2px] text-[#555]">Reference</dt>
          <dd className="font-mono text-sm font-semibold tracking-wider text-[#121212]">{reference}</dd>
        </dl>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#121212] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
          >
            Back to Home
          </Link>
          <Link
            href="/team"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#121212] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[#121212] transition-colors hover:bg-[#f3c276] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212]"
          >
            Meet the team <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
