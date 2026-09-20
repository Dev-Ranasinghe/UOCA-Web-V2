// Built using Hyperiux Vault: https://vault.hyperiux.com

"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

// Club photos (public/images/impact), one per card.
const IMG = {
  handover: "/images/impact/handover.webp",
  lamp: "/images/impact/lamp-lighting.webp",
  graduation: "/images/impact/graduation.webp",
  awards: "/images/impact/awards-night.webp",
  tokens: "/images/impact/tokens-of-appreciation.webp",
  medal: "/images/impact/club-medal.webp",
  members: "/images/impact/members.webp",
  runnersUp: "/images/impact/runners-up.webp",
} as const;

// per-image rest scale, keyed by img index (1-8). default 1, drop below to shrink.
const SCALE: Partial<Record<number, number>> = {
  1: 0.9,
  2: 0.8,
  3: 0.9,
  4: 0.8,
  5: 0.8,
  6: 0.9,
  7: 0.9,
  8: 0.7,
};
const s = (i: number) => SCALE[i] ?? 1;

// array order = stack order, back (z 2) -> front (z 9)
const CARDS: StackSpreadCard[] = [
  // top-left stripes — sm row 1 left
  {
    item: { src: IMG.members, alt: "Two Leos posing together outdoors" },
    number: "HOLAAA",
    stackOffset: { x: -8, y: -10 },
    stackRotate: -18,
    target: { x: -20, y: -30, rotate: 0, scale: s(8), w: 14 },
    targetSm: { x: -22, y: -40 },
    z: 2,
  },
  // top-right meadow — sm row 1 right
  {
    item: { src: IMG.runnersUp, alt: "Runners-up award presented to the Leo Club of UOC Alumni on stage" },
    number: "HOLAAA",
    stackOffset: { x: 14, y: -10 },
    stackRotate: 20,
    target: { x: 32, y: -26, rotate: 0, scale: s(7), w: 18 },
    targetSm: { x: 22, y: -40 },
    z: 3,
  },
  // mid-left jacket — sm row 2 left
  {
    item: { src: IMG.tokens, alt: "Two members exchanging tokens of appreciation on stage" },
    number: "HOLAAA",
    stackOffset: { x: -16, y: 0 },
    stackRotate: -4,
    target: { x: -36, y: -2, rotate: 0, scale: s(6), w: 17 },
    targetSm: { x: -22, y: -19 },
    z: 4,
  },
  // top-centre footballer — sm row 2 right
  {
    item: { src: IMG.graduation, alt: "Alumni in graduation gowns gathered outdoors, in black and white" },
    number: "HOLAAA",
    stackOffset: { x: 1, y: -10 },
    stackRotate: -2,
    target: { x: 6, y: -27, rotate: 0, scale: s(5), w: 20 },
    targetSm: { x: 22, y: -19 },
    z: 5,
  },
  // mid-right dog — sm row 3 left
  {
    item: { src: IMG.handover, alt: "Two club leaders at the presidential handover on stage" },
    number: "HOLAAA",
    stackOffset: { x: 18, y: 1 },
    stackRotate: 6,
    target: { x: 37, y: 6, rotate: 0, scale: s(4), w: 19 },
    targetSm: { x: -22, y: 20 },
    z: 6,
  },
  // bottom-left breaker — sm row 3 right
  {
    item: { src: IMG.awards, alt: "Members receiving an award on stage at the annual conference" },
    number: "HOLAAA",
    stackOffset: { x: -6, y: 10 },
    stackRotate: 6,
    target: { x: -24, y: 31, rotate: 0, scale: s(3), w: 18 },
    targetSm: { x: 22, y: 20 },
    z: 7,
  },
  // bottom-centre painting — sm row 4 left
  {
    item: { src: IMG.lamp, alt: "A guest lighting the traditional oil lamp at a Leo Club ceremony" },
    number: "HOLAAA",
    stackOffset: { x: 8, y: 7 },
    stackRotate: 3,
    target: { x: 2, y: 33, rotate: 0, scale: s(2), w: 18 },
    targetSm: { x: -22, y: 40 },
    z: 8,
  },
  // bottom-right plane — sm row 4 right
  {
    item: { src: IMG.medal, alt: "Leo Club of UOC Alumni 2026/27 medallion: Passion Meets Purpose" },
    number: "HOLAAA",
    stackOffset: { x: 20, y: 12 },
    stackRotate: -7,
    target: { x: 30, y: 34, rotate: 0, scale: s(1), w: 15 },
    targetSm: { x: 22, y: 40 },
    z: 9,
  },
];

// ---------------------------------------------------------------------------
// Mechanism
// ---------------------------------------------------------------------------

// Scroll progress where the cluster starts scattering and where it finishes.
// Kept tight so the cards start responding almost as soon as the section is
// scrolled into — a long hold here reads as scroll lag.
const SCATTER_START = 0.05;
const SCATTER_END = 0.85;

const PARALLAX_X = 2.6;
const PARALLAX_Y = 2.2;
const PARALLAX_SPRING = { stiffness: 90, damping: 22, mass: 0.6 };
const parallaxDepth = (i: number, total: number) =>
  total <= 1 ? 1 : 0.55 + (i / (total - 1)) * 0.75;

const SUB =
  "Moments, accolades, and dedicated members defining our journey at the Leo Club of UOC Alumni.";

const RESPONSIVE = {
  desktop: {
    scale: null as number | null,
    small: false,
    colX: null as number | null,
    card: null as { w: number } | null,
  },
  small: {
    scale: 0.72,
    small: true,
    colX: 22,
    card: { w: 40 },
  },
};

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE.desktop);
  useEffect(() => {
    // Touch vs. mouse, not raw width: a narrow but mouse-driven frame (21st
    // preview, split editor) keeps the desktop scatter + pointer parallax;
    // only real touch devices drop to the stacked column layout.
    const mq = window.matchMedia("(pointer: coarse)");
    const read = () => setR(mq.matches ? RESPONSIVE.small : RESPONSIVE.desktop);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return r;
}

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, PARALLAX_SPRING);
  const y = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled) return;

    if (!active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

export interface StackSpreadItem {
  src: string;
  alt?: string;
}

export interface StackSpreadTarget {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  /** side length of the (square) card, in vw */
  w: number;
}

export interface StackSpreadCard {
  item: StackSpreadItem;
  /** shown in the "[xxx]" tag on the card's dashed header line */
  number?: string;
  target: StackSpreadTarget;
  /** final x/y (vw/vh) for tablet + mobile; falls back to `target` */
  targetSm?: { x: number; y: number };
  /** angle while clustered */
  stackRotate?: number;
  /** offset while clustered (vw/vh) */
  stackOffset?: { x: number; y: number };
  /** paint order, higher on top */
  z?: number;
}

function Card({
  card,
  progress,
  reduce,
  clusterRotation,
  scaleMul,
  isSmall,
  colX,
  fixedCard,
  stackScale,
  cardRadius,
  pointer,
  depth,
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  clusterRotation: boolean;
  /** uniform rest-scale for every card; null = use each card's own scale */
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  fixedCard: { w: number } | null;
  /** scale of the cards while clustered, before the scatter */
  stackScale: number;
  /** corner radius on each card, in px (desktop) */
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
}) {
  const { item, target, number } = card;

  const flat = reduce === true;
  const stackRotate = flat ? 0 : clusterRotation ? card.stackRotate ?? 0 : 0;
  const stackOffset = card.stackOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  // final resting spot: column grid on small screens, scatter on desktop
  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm
    ? colX != null
      ? Math.sign(sm.x) * colX
      : sm.x
    : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  // -50% keeps card centred on its anchor
  const translate = useTransform(
    [progress, pointer.x, pointer.y],
    ([p, px, py]: number[]) => {
      const tx = stackOffset.x + (endX - stackOffset.x) * p;
      const ty = stackOffset.y + (endY - stackOffset.y) * p;
      const drift = depth * p;
      const dx = tx - px * PARALLAX_X * drift;
      const dy = ty - py * PARALLAX_Y * drift;
      return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
    },
  );
  const rotate = useTransform(progress, [0, 1], [stackRotate, endRotate]);
  const scale = useTransform(progress, [0, 1], [stackScale, restScale]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        // Square: width and height share one unit, so the card keeps its shape at any window size.
        width: `${fixedCard ? fixedCard.w : target.w}vw`,
        height: `${fixedCard ? fixedCard.w : target.w}vw`,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
    >
      <CardFace item={item} cardRadius={cardRadius} number={number} />
    </motion.div>
  );
}

function CardFace({
  item,
  cardRadius,
  number,
}: {
  item: StackSpreadItem;
  cardRadius: number;
  number?: string;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden border border-[#121212] bg-[#eae7e1] p-[3%]"
      style={{ borderRadius: `${cardRadius}px` }}
    >
      {number ? (
        <div className="mb-[6%] flex shrink-0 items-center gap-1.5 font-mono text-[0.6vw] text-[#121212] max-md:text-[1.8vw]">
          <span className="font-semibold tracking-[2px]">ooo</span>
          <div className="flex-1 border-b border-dashed border-[#121212]" />
          <span className="font-normal text-[#222]">[{number}]</span>
        </div>
      ) : null}
      <div className="relative w-full flex-1 overflow-hidden border border-[#121212]">
        <img
          src={item.src}
          alt={item.alt ?? ""}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

interface StackSpreadStageProps {
  cards: StackSpreadCard[];
  /** scatter scroll distance, in vh */
  scrollLength?: number;
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** color of the centre headline and subtitle */
  textColor?: string;
  /** scroll progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
  /** show the "scroll to spread" hint at the bottom until the scatter begins */
  showScrollHint?: boolean;
}

function StackSpreadStage({
  cards,
  scrollLength = 260,
  bgColor = "#ececeb",
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 8,
  textColor = "#141414",
  textFadeStart = 0.3,
  showScrollHint = true,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } =
    useResponsive();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  // hold, scatter, then settle
  const progress = useTransform(
    scrollYProgress,
    [0, SCATTER_START, SCATTER_END, 1],
    [0, 0, 1, 1],
  );

  // centre text always fades in on scroll; the scale-in is dropped only when
  // reduced motion is confirmed (`true`), not on the null SSR value.
  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setSpread((was) => (was ? p > 0.985 : p >= 0.999));
  });
  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  const noScale = reduce === true;
  const copyOpacity = useTransform(progress, [textFadeStart, textFadeStart + 0.35], [0, 1]);
  const copyScale = useTransform(progress, [textFadeStart, 0.9], [0.85, 1]);

  // scroll hint: visible while clustered, gone by the time the scatter starts
  const hintOpacity = useTransform(progress, [0, SCATTER_START], [1, 0]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full"
      style={{ height: `${scrollLength}vh`, backgroundColor: bgColor }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* centre text */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center max-md:px-8"
          style={{
            opacity: copyOpacity,
            scale: noScale ? 1 : copyScale,
          }}
        >
          <h2
            className="font-serif w-full text-[4.5vw] font-bold leading-none! tracking-tight max-md:text-[10vw]"
            style={{ color: textColor }}
          >
            Impact <span className="opacity-60">Through</span> Action.
          </h2>
          <p
            className="font-sans mt-[1.2vw] w-full max-w-[52ch] text-[1.15vw] leading-relaxed tracking-tight max-md:mt-3 max-md:text-[3.6vw]"
            style={{ color: textColor, opacity: 0.6 }}
          >
            {SUB}
          </p>
        </motion.div>

        {/* scattering cards */}
        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              reduce={reduce}
              clusterRotation={clusterRotation}
              scaleMul={scaleMul}
              isSmall={isSmall}
              colX={colX}
              fixedCard={fixedCard}
              stackScale={stackScale}
              cardRadius={cardRadius}
              pointer={pointer}
              depth={parallaxEnabled ? parallaxDepth(i, cards.length) : 0}
            />
          ))}
        </div>

        {/* scroll hint */}
        {showScrollHint && (
          <motion.div
            className="font-mono pointer-events-none absolute inset-x-0 bottom-[3vh] z-20 flex flex-col items-center gap-[0.6vh] text-[0.8vw] font-medium uppercase tracking-[0.2em] max-md:bottom-6 max-md:gap-1 max-md:text-[2.8vw]"
            style={{ color: textColor, opacity: hintOpacity }}
          >
            <span>Scroll</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-bounce max-md:h-[4vw] max-md:w-[4vw]"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export interface StackSpreadProps {
  /** scatter scroll distance, in vh */
  scrollLength?: number;
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** color of the centre headline and subtitle */
  textColor?: string;
  /** scroll progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
  /** show the "scroll to spread" hint at the bottom until the scatter begins */
  showScrollHint?: boolean;
}

export default function StackSpread({
  scrollLength = 260,
  bgColor = "#ececeb",
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 8,
  textColor = "#141414",
  textFadeStart = 0.3,
  showScrollHint = true,
}: StackSpreadProps) {
  return (
    <StackSpreadStage
      cards={CARDS}
      scrollLength={scrollLength}
      bgColor={bgColor}
      clusterRotation={clusterRotation}
      stackScale={stackScale}
      cardRadius={cardRadius}
      textColor={textColor}
      textFadeStart={textFadeStart}
      showScrollHint={showScrollHint}
    />
  );
}
