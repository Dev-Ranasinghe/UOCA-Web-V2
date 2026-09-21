"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";

// three.js and react-three-fiber are large, so they load only when the section is about to be seen, never with the first paint.
const InfiniteGallery = dynamic(() => import("@/components/ui/3d-gallery-photography"), { ssr: false });

// Candid shots from the "Web Element" folder, resized to 1600px in public/images/unscripted.
const photos = [
  { src: "/images/unscripted/unscripted-01.jpg", alt: "Four members in black suits standing between parked cars" },
  { src: "/images/unscripted/unscripted-02.jpg", alt: "A member in a black suit and blue tie posing beside a member in a saree" },
  { src: "/images/unscripted/unscripted-03.jpg", alt: "Three members seen from behind, posing with their hands behind their backs" },
  { src: "/images/unscripted/unscripted-04.jpg", alt: "Three members laughing and posing around a tree" },
  { src: "/images/unscripted/unscripted-05.jpg", alt: "A member in a blue saree reaching toward another on an empty road" },
  { src: "/images/unscripted/unscripted-06.jpg", alt: "Members piled together, laughing beside a pond" },
  { src: "/images/unscripted/unscripted-07.jpg", alt: "Eight members in blue sarees lined up under a tree" },
  { src: "/images/unscripted/unscripted-08.jpg", alt: "A member in a black suit smiling and looking down" },
  { src: "/images/unscripted/unscripted-09.jpg", alt: "Members huddled together on a wet road" },
  { src: "/images/unscripted/unscripted-10.jpg", alt: "Two members in black suits, one looking up and one with hands pressed together" },
  { src: "/images/unscripted/unscripted-11.jpg", alt: "Four members in black suits smiling under a tree" },
];

/** True while `ref` is within `margin` of the viewport. */
function useNearViewport(ref: RefObject<Element | null>, margin: string) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: margin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin]);
  return near;
}

/**
 * "Unscripted": a full-screen 3D photo tunnel pinned to the viewport. The track is 350svh tall and the panel inside it
 * is `sticky`, so the page holds still for 250svh of scrolling while every photo flies past, then scrolls on.
 * `progress` (0 to 1 through that pinned stretch) is what drives the gallery.
 */
export default function CommunitySpotlight() {
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const preload = useNearViewport(track, "900px 0px"); // start loading the code and photos a little early
  const visible = useNearViewport(track, "0px"); // only render frames while it is actually on screen
  const [mounted, setMounted] = useState(false);
  if (preload && !mounted) setMounted(true);

  useEffect(() => {
    const el = track.current;
    const panel = el?.firstElementChild;
    if (!el || !panel) return;
    const update = () => {
      const run = el.offsetHeight - panel.clientHeight;
      progress.current = run > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / run)) : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section aria-labelledby="unscripted-title" className="section-dark w-full bg-black border-t border-b border-[#222]">
      <div ref={track} className="relative h-[350svh]">
        <div className="sticky top-0 isolate h-svh w-full overflow-hidden bg-black">
          {/* Soft top and bottom edges so photos dissolve into the black instead of being cut off by the canvas */}
          <div className="h-full [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_92%,transparent)]">
            {mounted && (
              <InfiniteGallery
                images={photos}
                progressRef={progress}
                speed={1.2}
                visibleCount={12}
                active={visible}
                className="h-full w-full"
              />
            )}
          </div>

          {/* Blends against the photos behind it: white on black, inverted over bright photos. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-white mix-blend-exclusion">
            <h2 id="unscripted-title" className="font-serif text-4xl md:text-7xl tracking-tight">
              <span className="italic">Unscripted</span>
            </h2>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-10 px-4 text-center font-mono text-[11px] font-semibold uppercase text-white">
            <p>Scroll, swipe or use the arrow keys to navigate</p>
            <p className="opacity-60">Auto-play resumes after 3 seconds of inactivity</p>
          </div>
        </div>
      </div>
    </section>
  );
}
