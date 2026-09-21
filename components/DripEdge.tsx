"use client";

import { useEffect, useRef } from "react";
import { computeFrame } from "@/lib/drip-edge";

/**
 * A dripping bottom edge for a dark section: the section's colour runs down past its bottom border from hand-placed spots.
 * Some drips hang long and creep, some are small beads, and some swell, pinch, and let a droplet fall (it fades as it drops).
 * The geometry and the choreography live in `lib/drip-edge.ts`; this file only paints frames and decides when to run.
 *
 * Put it as the last child of a `relative` section (the section must not clip vertically: use `overflow-x-clip`, not
 * `overflow-hidden`) and drop the section's own bottom border. It hangs into the gap below the section, so keep its height
 * (set through `className`, read back here in px) at or under `--section-gap`; falling droplets fade out before the bottom.
 *
 * On first sight the drips run down from nothing, staggered. After that the loop only runs while the edge is on screen, and
 * reduced-motion visitors get the finished shape, still.
 */

const MAX_DROPLETS = 6;

export default function DripEdge({ color = "#050505", className = "" }: { color?: string; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const droplets = useRef<(SVGEllipseElement | null)[]>([]);

  useEffect(() => {
    const svgEl = svg.current;
    const pathEl = path.current;
    if (!svgEl || !pathEl) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let introAt = -1; // performance.now() when the edge first came into view
    let raf = 0;

    const draw = (now: number) => {
      if (!width || !height) return;
      const introElapsed = reduced ? Infinity : introAt < 0 ? 0 : (now - introAt) / 1000;
      const frame = computeFrame(width, height, now / 1000, introElapsed, reduced);
      pathEl.setAttribute("d", frame.d);
      droplets.current.forEach((el, i) => {
        if (!el) return;
        const drop = frame.droplets[i];
        if (!drop) {
          el.setAttribute("opacity", "0");
          return;
        }
        el.setAttribute("cx", drop.cx.toFixed(1));
        el.setAttribute("cy", drop.cy.toFixed(1));
        el.setAttribute("rx", drop.rx.toFixed(1));
        el.setAttribute("ry", drop.ry.toFixed(1));
        el.setAttribute("opacity", drop.opacity.toFixed(2));
      });
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && !reduced) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const measure = () => {
      width = svgEl.clientWidth;
      height = svgEl.clientHeight;
      svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
      draw(performance.now());
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(svgEl);
    measure();

    // Start the intro when the edge is actually in view, a little above the bottom of the screen
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (introAt < 0) introAt = performance.now();
          if (reduced) draw(performance.now());
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    visibility.observe(svgEl);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svg}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute left-0 top-full block w-full -mt-px overflow-visible ${className}`}
    >
      <path ref={path} fill={color} />
      {Array.from({ length: MAX_DROPLETS }, (_, i) => (
        <ellipse
          key={i}
          ref={(el) => {
            droplets.current[i] = el;
          }}
          fill={color}
          opacity="0"
        />
      ))}
    </svg>
  );
}
