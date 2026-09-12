"use client";

import React, { useEffect, useRef } from "react";

export interface PfxEffect {
  enabled: boolean;
  intensity: number;
}

export interface AsciiEffectConfig {
  pfx: {
    bloom: PfxEffect;
    glitch: PfxEffect;
    filmDust: PfxEffect;
    halftone: PfxEffect;
    pixelate: PfxEffect;
    vignette: PfxEffect;
    chromatic: PfxEffect;
    filmGrain: PfxEffect;
    scanLines: PfxEffect;
  };
  mask: {
    tool?: string;
    invert: boolean;
    shapes?: unknown[];
    dataUrl: string | null;
    enabled: boolean;
    brushSize?: number;
    showOverlay?: boolean;
  };
  tint: string;
  bgBlur: number;
  bgMode: "none" | "blur" | "color" | "photo";
  bgColor?: string;
  invert: boolean;
  lights: {
    points: { x: number; y: number; radius: number; intensity: number }[];
    enabled: boolean;
  };
  charSet: string;
  density: number;
  animated: boolean;
  blurType: "off" | "gaussian" | "directional" | "lens" | "tilt";
  cellSize: number;
  contrast: number;
  coverage: number;
  animSpeed: { enabled: boolean; intensity: number };
  animStyle: "wave" | "pulse" | "shimmer" | "ripple" | "flicker";
  bgOpacity: number;
  blurAngle: number;
  grayscale: number;
  lensFocus: number;
  tiltFocus: number;
  toneCurve: { x: number; y: number }[];
  blurAmount: number;
  brightness: number;
  renderMode: string;
  saturation: number;
  styleBlend: GlobalCompositeOperation;
  blurCenterX: number;
  blurCenterY: number;
  customChars: string;
  tiltFeather: number;
  tintOpacity: number;
  edgeEmphasis: number;
  overlayBlend: GlobalCompositeOperation;
  tiltPosition: number;
  animIntensity: { enabled: boolean; intensity: number };
  progressiveReverse: boolean;
  progressivePosition: number;
  directionalBothSides: boolean;
}

const CHAR_SETS: Record<string, string> = {
  standard: " .:-=+*#%@",
  blocks: " ░▒▓█",
  binary: " 01",
};

const HEX_CHARS = "0123456789abcdef";
const BRAILLE = " ⠁⠃⠇⠧⠷⠿⡿⣿";
const MATRIX_GLYPHS = "アイウエオカキクケコ0123456789";
const MIXED_SHAPES = ["dots", "cross", "diamond", "triangles", "hexagons"];

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function luminance01(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function drawPrimitive(
  ctx: CanvasRenderingContext2D,
  mode: string,
  cx: number,
  cy: number,
  size: number,
  color: string,
  seed: number
) {
  const s = Math.max(0, size);
  if (s <= 0) return;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (mode) {
    case "dots":
    case "bubbles": {
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
      ctx.fill();
      if (mode === "bubbles") {
        ctx.lineWidth = Math.max(1, s * 0.08);
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx - s * 0.12, cy - s * 0.12, s * 0.18, 0, Math.PI * 2);
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "rings": {
      ctx.lineWidth = Math.max(1, s * 0.18);
      ctx.beginPath();
      ctx.arc(cx, cy, s / 2.4, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "cross": {
      const t = Math.max(1, s * 0.22);
      ctx.fillRect(cx - t / 2, cy - s / 2, t, s);
      ctx.fillRect(cx - s / 2, cy - t / 2, s, t);
      break;
    }
    case "diamond": {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.restore();
      break;
    }
    case "voxel":
    case "lego": {
      const r = s * 0.15;
      const x0 = cx - s / 2;
      const y0 = cy - s / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.arcTo(x0 + s, y0, x0 + s, y0 + s, r);
      ctx.arcTo(x0 + s, y0 + s, x0, y0 + s, r);
      ctx.arcTo(x0, y0 + s, x0, y0, r);
      ctx.arcTo(x0, y0, x0 + s, y0, r);
      ctx.closePath();
      ctx.fill();
      if (mode === "lego") {
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "hexagons": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + (s / 2) * Math.cos(a);
        const py = cy + (s / 2) * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "triangles": {
      const dir = seed > 0.5 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - (s / 2) * dir);
      ctx.lineTo(cx + s / 2, cy + (s / 2) * dir);
      ctx.lineTo(cx - s / 2, cy + (s / 2) * dir);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "stars": {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s / 2 : s / 4.5;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "hearts": {
      const t = s / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + t * 0.6);
      ctx.bezierCurveTo(cx + t, cy - t * 0.2, cx + t * 0.5, cy - t, cx, cy - t * 0.3);
      ctx.bezierCurveTo(cx - t * 0.5, cy - t, cx - t, cy - t * 0.2, cx, cy + t * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
    }
  }
}

export default function AsciiEffectCanvas({
  src,
  config,
  className = "",
  style,
}: {
  src: string;
  config: AsciiEffectConfig;
  className?: string;
  style?: React.CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const srcBuffer = document.createElement("canvas");
    const sctx = srcBuffer.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;

    const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(src);
    let imageReady = false;
    let img: HTMLImageElement | HTMLVideoElement;
    let tryPlay: () => void = () => {};
    let onVisibility: (() => void) | null = null;
    let watchdog = 0;
    // Declared before the media setup below, which closes over it.
    let destroyed = false;

    if (isVideo) {
      const video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "auto";
      video.style.position = "absolute";
      video.style.inset = "0";
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      // Kept in the DOM (behind the canvas, which fully covers it) so the
      // browser actually decodes frames — detached <video> elements are
      // throttled/skipped by most browsers, unlike <img>.
      container!.insertBefore(video, container!.firstChild);

      // Playback is nudged from several angles rather than a single attempt:
      // one `play()` on one event loses the race whenever autoplay is deferred
      // (hidden tab, decoder not warm yet), and the frame then sticks forever.
      tryPlay = () => {
        if (destroyed || video.readyState < 2 || !video.paused) return;
        video.play().catch(() => {});
      };
      for (const evt of ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"]) {
        video.addEventListener(evt, tryPlay);
      }
      video.addEventListener("stalled", tryPlay);
      video.addEventListener("suspend", tryPlay);
      onVisibility = () => {
        if (!document.hidden) tryPlay();
      };
      document.addEventListener("visibilitychange", onVisibility);

      // Watchdog on a timer rather than rAF: rAF is frozen entirely while the
      // tab is hidden, so it cannot recover a fetch that stalled at
      // readyState 0 — which is the "sometimes it just never loads" case.
      let reloads = 0;
      watchdog = window.setInterval(() => {
        if (destroyed) return;
        if (video.readyState >= 2) {
          tryPlay();
          return;
        }
        // Browsers defer media loading entirely while the tab is hidden, so
        // retrying then would just burn the budget before the user ever looks
        // at the page. Only spend retries when loading can actually progress.
        if (document.hidden) return;
        if (reloads < 5) {
          reloads += 1;
          video.load();
        }
      }, 2000);
      video.addEventListener("error", () => {
        if (!destroyed && !document.hidden && reloads < 5) {
          reloads += 1;
          video.load();
        }
      });

      video.src = src;
      video.load();
      img = video;
    } else {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        imageReady = true;
      };
      image.src = src;
      // A cached image can already be complete before `onload` is attached.
      if (image.complete && image.naturalWidth > 0) imageReady = true;
      img = image;
    }

    // Derived from live state instead of a one-shot flag, so a missed event
    // can never leave the source permanently stuck as "not ready".
    const isSourceReady = () =>
      isVideo ? (img as HTMLVideoElement).readyState >= 2 : imageReady;

    const getSourceWidth = () =>
      isVideo ? (img as HTMLVideoElement).videoWidth : (img as HTMLImageElement).width;
    const getSourceHeight = () =>
      isVideo ? (img as HTMLVideoElement).videoHeight : (img as HTMLImageElement).height;

    let maskImg: HTMLImageElement | null = null;
    let maskReady = false;

    let raf = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = container!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      // Keep the sampling buffer in sync even when the display canvas was
      // sized before the first ResizeObserver callback.
      if (srcBuffer.width !== w || srcBuffer.height !== h) {
        srcBuffer.width = w;
        srcBuffer.height = h;
      }
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    function draw(time: number) {
      if (destroyed || !ctx || !sctx) return;
      const cfg = configRef.current;
      const w = canvas!.width;
      const h = canvas!.height;

      if (!isSourceReady() || w < 2 || h < 2) {
        // Keep nudging playback while we wait: autoplay is often deferred
        // until the element is on-screen and the tab is focused.
        if (isVideo) tryPlay();
        raf = requestAnimationFrame(draw);
        return;
      }
      // Self-heal if playback was deferred or paused after it began.
      if (isVideo && (img as HTMLVideoElement).paused) tryPlay();

      const srcW = getSourceWidth();
      const srcH = getSourceHeight();
      if (srcW < 1 || srcH < 1) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const scale = Math.max(w / srcW, h / srcH);
      const iw = srcW * scale;
      const ih = srcH * scale;
      const ix = (w - iw) / 2;
      const iy = (h - ih) / 2;

      // --- Step 1: background layer ---
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, w, h);
      if (cfg.bgMode !== "none") {
        ctx.save();
        ctx.globalAlpha = cfg.bgOpacity / 100;
        if (cfg.bgMode === "color") {
          ctx.fillStyle = cfg.bgColor || "#000000";
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.filter = cfg.bgMode === "blur" ? `blur(${cfg.bgBlur}px)` : "none";
          ctx.drawImage(img, ix, iy, iw, ih);
        }
        ctx.restore();
      }

      // --- Steps 2 & 4: draw filtered source into an offscreen buffer we sample from ---
      const brightnessPct = 100 + cfg.brightness;
      const blurPx = cfg.blurType !== "off" ? cfg.blurAmount / 10 : 0;
      const invertPct = cfg.invert ? 100 : 0;

      sctx.save();
      sctx.clearRect(0, 0, w, h);
      sctx.filter = `brightness(${brightnessPct}%) contrast(${cfg.contrast}%) saturate(${cfg.saturation}%) grayscale(${cfg.grayscale}%) invert(${invertPct}%)${blurPx > 0 ? ` blur(${blurPx}px)` : ""}`;
      sctx.drawImage(img, ix, iy, iw, ih);
      sctx.filter = "none";
      if (cfg.tintOpacity > 0) {
        sctx.globalCompositeOperation = cfg.overlayBlend || "multiply";
        sctx.globalAlpha = cfg.tintOpacity / 100;
        sctx.fillStyle = cfg.tint;
        sctx.fillRect(0, 0, w, h);
      }
      sctx.restore();

      let data: ImageData;
      try {
        data = sctx.getImageData(0, 0, w, h);
      } catch {
        raf = requestAnimationFrame(draw);
        return;
      }
      const pixels = data.data;

      const cell = Math.max(2, cfg.cellSize) * dpr;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const step = Math.max(1, Math.floor(cell / 4));

      const t = time / 1000;
      const speed = cfg.animSpeed.enabled ? cfg.animSpeed.intensity / 40 : 0;
      const ampBase = cfg.animIntensity.enabled ? cfg.animIntensity.intensity / 100 : 0;
      const densityAmt = Math.max(0, Math.min(1, cfg.density / 100));
      const coverageAmt = Math.max(0, Math.min(1, cfg.coverage / 100));
      const inkBase = 0.35 + densityAmt * 0.65;

      const charSetStr =
        cfg.customChars && cfg.customChars.length > 0
          ? cfg.customChars
          : CHAR_SETS[cfg.charSet] || CHAR_SETS.standard;

      const isTextMode =
        cfg.renderMode === "characters" ||
        cfg.renderMode === "hexdump" ||
        cfg.renderMode === "braille" ||
        cfg.renderMode === "matrix";
      if (isTextMode) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${Math.floor(cell * 0.95)}px var(--font-mono, monospace)`;
      }

      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const px0 = rx * cell;
          const py0 = ry * cell;
          const cw = Math.min(cell, w - px0);
          const ch = Math.min(cell, h - py0);
          if (cw <= 0 || ch <= 0) continue;

          const cellSeed = hash2(rx, ry);
          if (coverageAmt < 1 && cellSeed > coverageAmt) continue;

          let rSum = 0,
            gSum = 0,
            bSum = 0,
            count = 0;
          for (let yy = 0; yy < ch; yy += step) {
            for (let xx = 0; xx < cw; xx += step) {
              const px = Math.min(w - 1, px0 + xx);
              const py = Math.min(h - 1, py0 + yy);
              const idx = (py * w + px) * 4;
              rSum += pixels[idx];
              gSum += pixels[idx + 1];
              bSum += pixels[idx + 2];
              count++;
            }
          }
          if (count === 0) continue;
          const r = rSum / count;
          const g = gSum / count;
          const b = bSum / count;
          let lum = luminance01(r, g, b);

          const cx = px0 + cw / 2;
          const cy = py0 + ch / 2;

          let mod = 0;
          if (cfg.animated) {
            switch (cfg.animStyle) {
              case "wave":
                mod = Math.sin(t * speed + rx * 0.35);
                break;
              case "pulse":
                mod = Math.sin(t * speed);
                break;
              case "ripple": {
                const dx = rx - cols / 2;
                const dy = ry - rows / 2;
                mod = Math.sin(t * speed - Math.sqrt(dx * dx + dy * dy) * 0.25);
                break;
              }
              case "flicker":
                mod = hash2(rx + Math.floor(t * speed * 6), ry) * 2 - 1;
                break;
              case "shimmer":
              default:
                mod = Math.sin(t * speed + (rx + ry) * 0.4 + cellSeed * 6.28);
                break;
            }
          }
          const amp = ampBase * 0.35;
          lum = Math.min(1, Math.max(0, lum + mod * amp));

          const color = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;

          switch (cfg.renderMode) {
            case "dither": {
              const sub = 4;
              const subSize = cell / sub;
              for (let sy = 0; sy < sub; sy++) {
                for (let sx = 0; sx < sub; sx++) {
                  const threshold = (BAYER4[sy][sx] + 0.5) / 16;
                  if (lum * inkBase > threshold) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                      px0 + sx * subSize,
                      py0 + sy * subSize,
                      Math.ceil(subSize),
                      Math.ceil(subSize)
                    );
                  }
                }
              }
              break;
            }
            case "characters": {
              const idx2 = Math.min(
                charSetStr.length - 1,
                Math.floor(lum * (charSetStr.length - 1))
              );
              ctx.fillStyle = color;
              ctx.fillText(charSetStr[idx2] ?? " ", cx, cy + 1);
              break;
            }
            case "hexdump": {
              const idx2 = Math.min(HEX_CHARS.length - 1, Math.floor(lum * (HEX_CHARS.length - 1)));
              ctx.fillStyle = color;
              ctx.fillText(HEX_CHARS[idx2], cx, cy + 1);
              break;
            }
            case "braille": {
              const idx2 = Math.min(BRAILLE.length - 1, Math.floor(lum * (BRAILLE.length - 1)));
              ctx.fillStyle = color;
              ctx.fillText(BRAILLE[idx2], cx, cy + 1);
              break;
            }
            case "matrix": {
              const idx2 = Math.floor(hash2(rx, Math.floor(t * 4) + ry) * MATRIX_GLYPHS.length);
              ctx.fillStyle = `rgba(0, ${180 + Math.floor(lum * 75)}, 90, ${0.4 + lum * 0.6})`;
              ctx.fillText(MATRIX_GLYPHS[idx2] ?? "0", cx, cy + 1);
              break;
            }
            case "pixel":
            case "mosaic": {
              ctx.fillStyle = color;
              ctx.fillRect(px0 + 0.5, py0 + 0.5, Math.max(0, cw - 1), Math.max(0, ch - 1));
              break;
            }
            case "halfblocks": {
              let tR = 0,
                tG = 0,
                tB = 0,
                tC = 0,
                bR = 0,
                bG = 0,
                bB = 0,
                bC = 0;
              for (let yy = 0; yy < ch; yy += step) {
                for (let xx = 0; xx < cw; xx += step) {
                  const px = Math.min(w - 1, px0 + xx);
                  const py = Math.min(h - 1, py0 + yy);
                  const idx = (py * w + px) * 4;
                  if (yy < ch / 2) {
                    tR += pixels[idx];
                    tG += pixels[idx + 1];
                    tB += pixels[idx + 2];
                    tC++;
                  } else {
                    bR += pixels[idx];
                    bG += pixels[idx + 1];
                    bB += pixels[idx + 2];
                    bC++;
                  }
                }
              }
              if (tC > 0) ctx.fillStyle = `rgb(${(tR / tC) | 0},${(tG / tC) | 0},${(tB / tC) | 0})`;
              ctx.fillRect(px0, py0, cw, ch / 2);
              if (bC > 0) ctx.fillStyle = `rgb(${(bR / bC) | 0},${(bG / bC) | 0},${(bB / bC) | 0})`;
              ctx.fillRect(px0, py0 + ch / 2, cw, ch - ch / 2);
              break;
            }
            case "lines":
            case "diagonal":
            case "hatch": {
              ctx.strokeStyle = color;
              ctx.lineWidth = Math.max(1, cell * 0.12 * inkBase * lum);
              ctx.beginPath();
              if (cfg.renderMode === "lines") {
                ctx.moveTo(px0, cy);
                ctx.lineTo(px0 + cw, cy);
              } else {
                ctx.moveTo(px0, py0 + ch);
                ctx.lineTo(px0 + cw, py0);
              }
              ctx.stroke();
              if (cfg.renderMode === "hatch") {
                ctx.beginPath();
                ctx.moveTo(px0, py0);
                ctx.lineTo(px0 + cw, py0 + ch);
                ctx.stroke();
              }
              break;
            }
            case "disco": {
              const hue = (t * 60 + rx * 10 + ry * 10) % 360;
              ctx.fillStyle = `hsl(${hue}, 80%, ${40 + lum * 30}%)`;
              const s2 = cell * (0.4 + lum * 0.6) * inkBase;
              ctx.beginPath();
              ctx.arc(cx, cy, s2 / 2, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "contour": {
              const band = Math.floor(lum * 6);
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              const yOff = Math.sin(rx * 0.5 + band) * (ch * 0.15);
              ctx.moveTo(px0, cy + yOff);
              ctx.quadraticCurveTo(cx, cy + yOff - ch * 0.2 * (lum - 0.5), px0 + cw, cy + yOff);
              ctx.stroke();
              break;
            }
            case "mixed": {
              const shape = MIXED_SHAPES[Math.floor(cellSeed * MIXED_SHAPES.length)];
              drawPrimitive(ctx, shape, cx, cy, cell * (0.3 + lum * 0.7) * inkBase, color, cellSeed);
              break;
            }
            default: {
              const size = cell * (0.25 + lum * 0.75) * inkBase;
              drawPrimitive(ctx, cfg.renderMode, cx, cy, size, color, cellSeed);
            }
          }
        }
      }

      // --- Step 5: post effects ---
      const pfx = cfg.pfx;
      if (pfx.vignette.enabled) {
        const inten = pfx.vignette.intensity / 100;
        const grad = ctx.createRadialGradient(
          w / 2,
          h / 2,
          Math.min(w, h) * 0.3,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.7
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${inten})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      if (pfx.scanLines.enabled) {
        ctx.save();
        ctx.globalAlpha = (pfx.scanLines.intensity / 100) * 0.5;
        ctx.fillStyle = "#000";
        for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
        ctx.restore();
      }
      if (pfx.filmGrain.enabled) {
        ctx.save();
        ctx.globalAlpha = (pfx.filmGrain.intensity / 100) * 0.5;
        const n = Math.floor((w * h) / 4000);
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
        ctx.restore();
      }
      if (pfx.chromatic.enabled) {
        const off = pfx.chromatic.intensity / 10;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.5;
        ctx.drawImage(canvas!, off, 0);
        ctx.drawImage(canvas!, -off, 0);
        ctx.restore();
      }
      if (pfx.pixelate.enabled) {
        const factor = 1 + pfx.pixelate.intensity / 20;
        const sw = Math.max(1, Math.floor(w / factor));
        const sh = Math.max(1, Math.floor(h / factor));
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas!, 0, 0, w, h, 0, 0, sw, sh);
        ctx.drawImage(canvas!, 0, 0, sw, sh, 0, 0, w, h);
        ctx.restore();
      }

      // --- Step 6: lights ---
      if (cfg.lights.enabled) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (const p of cfg.lights.points) {
          const lx = p.x * w;
          const ly = p.y * h;
          const lr = p.radius * Math.max(w, h);
          const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
          grad.addColorStop(0, `rgba(255,255,255,${p.intensity / 100})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.restore();
      }

      // --- Step 7: mask (reveal back to the plain photo) ---
      const mask = cfg.mask;
      if (mask.enabled && mask.dataUrl) {
        if (!maskImg) {
          maskImg = new Image();
          maskImg.onload = () => {
            maskReady = true;
          };
          maskImg.src = mask.dataUrl;
        }
        if (maskReady && maskImg) {
          ctx.save();
          ctx.globalCompositeOperation = "destination-out";
          if (!mask.invert) ctx.drawImage(maskImg, 0, 0, w, h);
          ctx.restore();
          ctx.save();
          ctx.globalCompositeOperation = "destination-over";
          ctx.drawImage(img, ix, iy, iw, ih);
          ctx.restore();
        }
      }

      // Video always needs a live loop — its frames change independently of
      // the ASCII animation setting.
      if (cfg.animated || isVideo) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (watchdog) clearInterval(watchdog);
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      if (isVideo) {
        const video = img as HTMLVideoElement;
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.remove();
      }
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
