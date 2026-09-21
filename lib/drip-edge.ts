/**
 * Geometry for DripEdge (components/DripEdge.tsx): a nearly flat edge with paint running down from hand-placed spots.
 * Pure functions, no DOM, so the shape at any moment can be computed (and checked) without an animation loop.
 *
 * Drips are placed by hand, not on a grid, in three layouts (phone, tablet, desktop). Each drip is one of three kinds:
 *  - creeper: a long, thin run that hangs and creeps very slowly, ending in a heavy bulb;
 *  - cycler:  swells, pinches its neck, lets a droplet fall away (it fades out as it drops), recoils, and starts again;
 *  - bead:    a short blob that has barely started, with a very slow breath.
 * Every drip has a thin neck that flares into the edge with a concave fillet and ends in a round bulb, which a function of
 * x alone cannot draw, so each drip is its own closed path unioned with the body (all subpaths wind the same way so the
 * overlaps stay filled).
 */

type Kind = "creeper" | "cycler" | "bead";

interface Spec {
  x: number; // centre, fraction of the width
  kind: Kind;
  w: number; // neck half-width, px at scale 1
  r: number; // bulb radius, px at scale 1
  f: number; // fillet radius where the neck meets the edge, px at scale 1
  reach?: number; // creeper/cycler: longest length, fraction of the room available
  period?: number; // cycler: seconds per drip
  offset?: number; // cycler: where in its cycle it starts, 0 to 1
  speed?: number; // creeper: creep speed, rad/s
  phase?: number;
  delay: number; // when it starts to run during the intro, 0 to 1
}

const DESKTOP: Spec[] = [
  { x: 0.06, kind: "creeper", w: 3.2, r: 8.5, f: 10, reach: 0.92, speed: 0.22, phase: 0.3, delay: 0.05 },
  { x: 0.135, kind: "bead", w: 5, r: 7.5, f: 13, delay: 0.25 },
  { x: 0.25, kind: "cycler", w: 3.6, r: 9.5, f: 11, reach: 0.8, period: 9.5, offset: 0.2, delay: 0.15 },
  { x: 0.38, kind: "bead", w: 5.5, r: 8, f: 14, delay: 0.4 },
  { x: 0.44, kind: "creeper", w: 4.4, r: 10.5, f: 12, reach: 0.58, speed: 0.18, phase: 2, delay: 0.3 },
  { x: 0.57, kind: "cycler", w: 3.4, r: 9, f: 10, reach: 0.88, period: 12, offset: 0.55, delay: 0 },
  { x: 0.68, kind: "bead", w: 5, r: 7.5, f: 13, delay: 0.5 },
  { x: 0.765, kind: "creeper", w: 3.6, r: 9, f: 11, reach: 0.74, speed: 0.26, phase: 4, delay: 0.2 },
  { x: 0.87, kind: "cycler", w: 3.8, r: 9.5, f: 11, reach: 0.66, period: 8, offset: 0.8, delay: 0.35 },
  { x: 0.945, kind: "creeper", w: 3, r: 8, f: 10, reach: 0.5, speed: 0.2, phase: 5.3, delay: 0.1 },
];

const TABLET: Spec[] = [
  { x: 0.07, kind: "creeper", w: 3.2, r: 8.5, f: 10, reach: 0.9, speed: 0.22, phase: 0.3, delay: 0.05 },
  { x: 0.2, kind: "cycler", w: 3.6, r: 9.5, f: 11, reach: 0.78, period: 9.5, offset: 0.2, delay: 0.2 },
  { x: 0.34, kind: "bead", w: 5.5, r: 8, f: 14, delay: 0.4 },
  { x: 0.5, kind: "creeper", w: 4.2, r: 10, f: 12, reach: 0.62, speed: 0.18, phase: 2, delay: 0.3 },
  { x: 0.66, kind: "cycler", w: 3.4, r: 9, f: 10, reach: 0.86, period: 12, offset: 0.55, delay: 0 },
  { x: 0.8, kind: "creeper", w: 3.4, r: 9, f: 11, reach: 0.7, speed: 0.26, phase: 4, delay: 0.15 },
  { x: 0.925, kind: "bead", w: 5, r: 7.5, f: 13, delay: 0.5 },
];

const PHONE: Spec[] = [
  { x: 0.09, kind: "creeper", w: 3.2, r: 8.5, f: 10, reach: 0.9, speed: 0.22, phase: 0.3, delay: 0.05 },
  { x: 0.28, kind: "bead", w: 5, r: 7.5, f: 13, delay: 0.35 },
  { x: 0.47, kind: "cycler", w: 3.6, r: 9.5, f: 11, reach: 0.82, period: 9, offset: 0.35, delay: 0.15 },
  { x: 0.69, kind: "creeper", w: 3.6, r: 9, f: 11, reach: 0.66, speed: 0.26, phase: 4, delay: 0.25 },
  { x: 0.885, kind: "cycler", w: 3.4, r: 9, f: 10, reach: 0.74, period: 11, offset: 0.7, delay: 0 },
];

/** Layout and size scale for a given width, matching Tailwind's sm (640) and lg (1024). */
function layoutFor(width: number) {
  if (width < 640) return { specs: PHONE, scale: 0.7, base: 8 };
  if (width < 1024) return { specs: TABLET, scale: 0.85, base: 10 };
  return { specs: DESKTOP, scale: 1, base: 12 };
}

const MAX_DRIP = 0.7; // fraction of the height a drip may hang to; the rest is left for a falling droplet
const INTRO_SECONDS = 2.4;
const PINCH_AT = 0.66; // cycle progress where the neck starts to thin
const DETACH_AT = 0.74; // cycle progress where the droplet lets go
const GRAVITY = 620; // px/s² at scale 1
const BODY_POINTS = 96;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (v: number) => 1 - Math.pow(1 - v, 3);
const smoothstep = (v: number) => v * v * (3 - 2 * v);

export interface Droplet {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
}

export interface Frame {
  d: string;
  droplets: Droplet[];
}

/** Resting height of the edge at x. Almost flat: two very low, mismatched undulations a few pixels tall, so it reads as
 *  a hand-poured edge, not as a wave. */
function edgeAt(u: number, base: number, scale: number) {
  return base + scale * (1.6 * Math.sin(u * 7.3 + 1.1) + 1 * Math.sin(u * 19.7 + 0.4));
}

interface DripShape {
  x: number;
  yb: number; // edge height at this drip
  len: number;
  w: number;
  r: number;
  f: number;
}

/** Closed path for one drip, right side first so it winds the same way as the body (clockwise on screen). */
function dripPath({ x, yb, len, w, r, f }: DripShape) {
  const cy = yb + len - r; // bulb centre
  const p = (v: number) => v.toFixed(1);
  return (
    `M${p(x + w + f)} ${p(yb - 1)}` +
    `Q${p(x + w)} ${p(yb)} ${p(x + w)} ${p(yb + f)}` +
    `C${p(x + w)} ${p(cy - 1.1 * r)} ${p(x + r)} ${p(cy - 0.9 * r)} ${p(x + r)} ${p(cy)}` +
    `A${p(r)} ${p(r)} 0 0 1 ${p(x - r)} ${p(cy)}` +
    `C${p(x - r)} ${p(cy - 0.9 * r)} ${p(x - w)} ${p(cy - 1.1 * r)} ${p(x - w)} ${p(yb + f)}` +
    `Q${p(x - w)} ${p(yb)} ${p(x - w - f)} ${p(yb - 1)}Z`
  );
}

/**
 * The shape at one moment.
 * @param seconds       continuous clock, drives the slow motion
 * @param introElapsed  seconds since the edge first came into view (drips run down from nothing); Infinity = finished
 * @param still         true for reduced motion: a finished, frozen composition with no droplets
 */
export function computeFrame(width: number, height: number, seconds: number, introElapsed: number, still = false): Frame {
  const { specs, scale, base } = layoutFor(width);
  const baseGrow = easeOutCubic(clamp01(introElapsed / 1.1));
  const droplets: Droplet[] = [];

  // The body: a nearly flat edge, drawn right to left along the bottom (clockwise on screen)
  const N = BODY_POINTS;
  let d = `M0 -2H${width}V${(edgeAt(1, base, scale) * baseGrow).toFixed(1)}`;
  for (let i = N - 1; i >= 0; i--) {
    const u = i / N;
    d += `L${(u * width).toFixed(1)} ${(edgeAt(u, base, scale) * baseGrow).toFixed(1)}`;
  }
  d += "Z";

  specs.forEach((spec) => {
    const x = spec.x * width;
    const yb = edgeAt(spec.x, base, scale) * baseGrow;
    const w0 = spec.w * scale;
    const rMax = spec.r * scale;
    const f = spec.f * scale;
    const r0 = Math.max(w0 * 1.5, rMax * 0.7); // radius of a bare stub
    const minLen = (rr: number) => f + 2.2 * rr;
    const room = Math.max(0, height * MAX_DRIP - yb);
    const longest = Math.min(room, Math.max(minLen(rMax), (spec.reach ?? 0.5) * room));
    const run = still ? 1 : easeOutCubic(clamp01((introElapsed / INTRO_SECONDS - spec.delay) / (1 - spec.delay)));

    let len: number;
    let r = r0;
    let w = w0;

    if (spec.kind === "bead") {
      const breath = still ? 1 : 1 + 0.05 * Math.sin(seconds * 0.5 + spec.x * 9);
      r = r0 * breath;
      len = minLen(r);
    } else if (spec.kind === "creeper") {
      const creep = still ? 0.94 : 0.88 + 0.12 * Math.sin(seconds * (spec.speed ?? 0.2) + (spec.phase ?? 0));
      r = rMax * (still ? 1 : 0.97 + 0.03 * Math.sin(seconds * 0.4 + (spec.phase ?? 0)));
      len = Math.max(minLen(r), longest * creep);
    } else {
      const period = spec.period ?? 10;
      const u = still ? 0.5 : (seconds / period + (spec.offset ?? 0)) % 1;
      if (u < DETACH_AT) {
        const g = u / DETACH_AT;
        r = r0 + (rMax - r0) * smoothstep(g);
        len = minLen(r0) + (longest - minLen(r0)) * Math.pow(g, 1.7);
        const pinch = clamp01((u - PINCH_AT) / (DETACH_AT - PINCH_AT));
        w = w0 * (1 - 0.6 * pinch * pinch);
        len += 0.06 * longest * pinch * pinch; // the bulb stretches as it gets heavy
        len = Math.max(len, minLen(r));
      } else {
        const q = (u - DETACH_AT) / (1 - DETACH_AT);
        const recoil = easeOutCubic(q);
        r = rMax + (r0 - rMax) * recoil;
        w = w0 * (0.4 + 0.6 * recoil);
        const spawnLen = longest * 1.06;
        len = Math.max(minLen(r), spawnLen + (minLen(r0) - spawnLen) * recoil);
        // The droplet that let go
        if (run >= 1) {
          const tau = (u - DETACH_AT) * period;
          const y0 = yb + spawnLen - rMax; // where the bulb was when it let go
          const fall = 0.5 * GRAVITY * scale * tau * tau;
          const room2 = Math.max(1, height - y0);
          const frac = fall / room2;
          if (frac < 1) {
            const speedNow = GRAVITY * scale * tau;
            const rx = rMax * 0.82;
            droplets.push({
              cx: x,
              cy: y0 + fall,
              rx,
              ry: rx * (1 + Math.min(0.45, speedNow / 1100)),
              opacity: 1 - Math.pow(frac, 1.5),
            });
          }
        }
      }
    }

    // While it runs down in the intro, blend from a bare stub to the current shape
    const stubLen = minLen(r0);
    const runLen = stubLen + (len - stubLen) * run;
    const runR = r0 + (r - r0) * run;
    d += dripPath({ x, yb, len: Math.max(minLen(runR), runLen), w, r: runR, f });
  });

  return { d, droplets };
}
