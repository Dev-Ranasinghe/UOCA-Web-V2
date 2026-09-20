"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Dithering } from "@paper-design/shaders-react";

// Adapted from the "neon dither" background. Differences from the original: it fills its parent (which must be
// `relative`) instead of the viewport, has one dark palette instead of following the OS theme (the original toggled
// the `dark` class on <html>, which would flip the whole site's theme tokens), and it stops animating when it
// is off-screen or the visitor prefers reduced motion.

export interface NeonDitherProps {
  /** Accent colour of the dither. Defaults to the site's yellow (the category-bar accent). */
  color?: string;
  /** Solid colour behind the dither. */
  background?: string;
  /** Visual intensity, 0..1. */
  intensity?: number;
  /** Subtle mouse parallax. */
  parallax?: boolean;
  className?: string;
}

const SITE_YELLOW = "#f0c808";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Scale a colour's brightness (keeps its hue). */
function shade(hex: string, factor: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex([Math.round(r * factor), Math.round(g * factor), Math.round(b * factor)]);
}

/** Linear RGB mix between two hex colours. */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return toHex([
    Math.round(ar + (br - ar) * t),
    Math.round(ag + (bg - ag) * t),
    Math.round(ab + (bb - ab) * t),
  ]);
}

export function NeonDither({
  color = SITE_YELLOW,
  background = "#000000",
  intensity = 0.8,
  parallax = true,
  className = "",
}: NeonDitherProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  // Don't animate a background nobody can see.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // A dimmed version of the accent for the dither itself, so it reads as texture rather than glare.
  const config = useMemo(() => {
    const t = clamp(intensity);
    return {
      front: mix(shade(color, 0.4), shade(color, 0.7), t * 0.35),
      speed: 0.28 + t * 0.35,
      px: Math.round(2 + t * 2),
      scale: 1.05 + t * 0.15,
      glow: `radial-gradient(60% 40% at 50% 40%, ${toRgba(color, 0.1)}, transparent 70%)`,
    };
  }, [color, intensity]);

  // Optional mouse parallax, scoped to this element.
  useEffect(() => {
    if (!parallax || reduceMotion) return;
    const layer = layerRef.current;
    if (!layer) return;

    const strength = 8; // px at the edges
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      layer.style.setProperty("--parallax-x", `${(-x * strength).toFixed(2)}px`);
      layer.style.setProperty("--parallax-y", `${(-y * strength).toFixed(2)}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [parallax, reduceMotion]);

  const animate = visible && !reduceMotion;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={["pointer-events-none absolute inset-0 overflow-hidden", className].join(" ")}
      style={{ backgroundColor: background }}
    >
      {/* Oversized so the parallax shift never reveals an edge. */}
      <div
        ref={layerRef}
        className="absolute -inset-3"
        style={{
          transform: parallax && !reduceMotion ? "translate3d(var(--parallax-x, 0), var(--parallax-y, 0), 0)" : undefined,
          willChange: parallax && !reduceMotion ? "transform" : undefined,
        }}
      >
        {/* Core dithering shader */}
        <Dithering
          colorBack="#00000000"
          colorFront={config.front}
          speed={animate ? config.speed : 0}
          shape="wave"
          type="4x4"
          pxSize={config.px}
          scale={config.scale}
          style={{ height: "100%", width: "100%" }}
        />

        {/* Soft glow */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: config.glow, mixBlendMode: "screen" }}
        />

        {/* Vignette for depth */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)" }}
        />

        {/* Film grain */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.25' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.11'/%3E%3C/svg%3E\")",
            backgroundSize: "cover",
            opacity: 0.5,
            mixBlendMode: "screen",
          }}
        />

        {/* Top shine */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 35%)", opacity: 0.25 }}
        />
      </div>
    </div>
  );
}

function toRgba(hex: string, alpha: number): string {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// The name used by the original component.
export { NeonDither as PaperDesignBackground };
