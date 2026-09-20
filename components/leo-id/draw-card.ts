import {
  CARD,
  TYPE,
  capHeight,
  qrModuleArea,
  splitName,
  type QrMatrix,
} from "@/lib/leo-id/card-layout";

/**
 * Single source of truth for how the UOCA ID looks. The page shows this canvas
 * directly and the "Download" button re-draws it onto a padded canvas, so the
 * saved image is always identical to what's on screen.
 */

export const CARD_SCALE = 2;
/** Paper margin around the card in the exported PNG. */
const EXPORT_MARGIN = 48;
const PAPER = "#eae7e1";
const WHITE = "#ffffff";
const CREAM = "#fffdf9";

type TypeStyle = { size: number; weight: number; tracking: number };

export type CardData = {
  fullName: string;
  /** Already upper-cased, e.g. "SECRETARY UOCA". */
  roleLabel: string;
  term: string;
  mylciId: string | null;
  qr: QrMatrix;
};

export type CardAssets = {
  fontFamily: string;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadCardAssets(opts: {
  fontFamily: string;
  photoSrc: string;
  logoSrc: string;
}): Promise<CardAssets> {
  const weights = [500, 600, 700];
  const [photo, logo] = await Promise.all([
    loadImage(opts.photoSrc),
    loadImage(opts.logoSrc),
    ...weights.map((w) => document.fonts.load(`${w} 20px ${opts.fontFamily}`, "ABC012/")),
  ]);
  return { fontFamily: opts.fontFamily, photo, logo };
}

// ---------------------------------------------------------------------------
// Text helpers. Tracking is applied per glyph (rather than ctx.letterSpacing) so
// measured widths are identical in every browser and there is no trailing space
// to throw off centring or right-alignment.
// ---------------------------------------------------------------------------

function fontString(assets: CardAssets, weight: number, size: number) {
  return `${weight} ${size}px ${assets.fontFamily}`;
}

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  const glyphs = Array.from(text);
  let w = 0;
  for (const ch of glyphs) w += ctx.measureText(ch).width;
  return w + tracking * Math.max(0, glyphs.length - 1);
}

type Align = "left" | "center" | "right";

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: Align = "left",
) {
  const total = trackedWidth(ctx, text, tracking);
  let cx = align === "left" ? x : align === "center" ? x - total / 2 : x - total;
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
}

/**
 * Sets ctx.font for `text` at the largest size ≤ style.size that fits maxWidth.
 * Shrinks down to 70%, then truncates with an ellipsis. Returns what to draw.
 */
function fit(
  ctx: CanvasRenderingContext2D,
  assets: CardAssets,
  text: string,
  style: TypeStyle,
  maxWidth: number,
) {
  const widthAt = (t: string, size: number) => {
    ctx.font = fontString(assets, style.weight, size);
    return trackedWidth(ctx, t, style.tracking * size);
  };
  let size = style.size;
  let out = text;
  let width = widthAt(out, size);
  if (width > maxWidth) {
    size = Math.max(style.size * 0.7, (style.size * maxWidth) / width);
    width = widthAt(out, size);
    while (width > maxWidth && out.length > 1) {
      out = out.slice(0, -1).trimEnd();
      width = widthAt(`${out}…`, size);
    }
    if (out !== text) out = `${out}…`;
  }
  ctx.font = fontString(assets, style.weight, size);
  return { text: out, size, tracking: style.tracking * size, width };
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Ticket outline: concave corner cut-outs and semicircle notches on the perforation. */
function ticketPath(): Path2D {
  const { w, h, cut, notch, perf } = CARD;
  const p = new Path2D();
  p.moveTo(cut, 0);
  p.arc(0, 0, cut, 0, Math.PI / 2, false);
  p.lineTo(0, h - cut);
  p.arc(0, h, cut, -Math.PI / 2, 0, false);
  p.lineTo(perf - notch, h);
  p.arc(perf, h, notch, Math.PI, Math.PI * 2, false);
  p.lineTo(w - cut, h);
  p.arc(w, h, cut, Math.PI, Math.PI * 1.5, false);
  p.lineTo(w, cut);
  p.arc(w, 0, cut, Math.PI / 2, Math.PI, false);
  p.lineTo(perf + notch, 0);
  p.arc(perf, 0, notch, 0, Math.PI, false);
  p.closePath();
  return p;
}

// ---------------------------------------------------------------------------
// Theme + backdrop. The animated shader lives in the DOM behind the canvas; the
// canvas paints only a soft scrim over it (for legibility) and the card content.
// ---------------------------------------------------------------------------

const DARK_INK = "#3b1d0e";

export type CardTheme = { ink: string; light: boolean };

function luminance(hex: string) {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** White text unless the background is too light for it (a remix can go pale), then dark ink. */
export function themeFor(colorBack: string): CardTheme {
  const whiteContrast = 1.05 / (luminance(colorBack) + 0.05);
  return whiteContrast >= 3 ? { ink: WHITE, light: false } : { ink: DARK_INK, light: true };
}

function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** The exported PNG has no DOM behind it, so it paints the shader's current frame itself. */
export type CardBackdrop = { colorBack: string; shader: HTMLCanvasElement | null };

function paintBackdrop(ctx: CanvasRenderingContext2D, theme: CardTheme, backdrop?: CardBackdrop) {
  const { w, h } = CARD;
  if (backdrop) {
    ctx.fillStyle = backdrop.colorBack;
    ctx.fillRect(0, 0, w, h);
    if (backdrop.shader && backdrop.shader.width > 0) {
      try {
        ctx.drawImage(backdrop.shader, 0, 0, w, h);
      } catch {
        // Texture unavailable — the flat colour above still makes a valid card.
      }
    }
  }

  // Deepens toward the bottom-left, like the reference; keeps small text readable over the speckle.
  const scrim = ctx.createLinearGradient(0, h, w, 0);
  if (theme.light) {
    scrim.addColorStop(0, "rgba(255,246,236,0.34)");
    scrim.addColorStop(1, "rgba(255,246,236,0.1)");
  } else {
    scrim.addColorStop(0, "rgba(140,40,6,0.5)");
    scrim.addColorStop(1, "rgba(140,40,6,0.14)");
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);
}

/** Draw `img` to fill (x, y, w, h), cropping the overflow toward the (fx, fy) focal point. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fx = 0.5,
  fy = 0.5,
) {
  const target = w / h;
  const source = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (source > target) sw = sh * target;
  else sh = sw / target;
  const sx = (img.naturalWidth - sw) * fx;
  const sy = (img.naturalHeight - sh) * fy;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Lucide "badge-check" (MyLCI ID) and "briefcase-business" (position), on the 24-unit grid,
// so the card's icons match the rest of the site's.
function strokeBadgeCheck(ctx: CanvasRenderingContext2D) {
  ctx.stroke(
    new Path2D(
      "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z",
    ),
  );
  ctx.stroke(new Path2D("m16 9-5.5 5.5L8 12"));
}

function strokeBriefcase(ctx: CanvasRenderingContext2D) {
  roundRectPath(ctx, 2, 6, 20, 14, 2);
  ctx.stroke();
  ctx.stroke(new Path2D("M12 12h.01M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M22 13a18.15 18.15 0 0 1-20 0"));
}

/** Draws a 24-unit lucide icon with its grid point (gx, gy) landing on (x, y). */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  paint: (ctx: CanvasRenderingContext2D) => void,
  color: string,
  scale: number,
  gx: number,
  gy: number,
  x: number,
  y: number,
) {
  ctx.save();
  ctx.translate(x - gx * scale, y - gy * scale);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5 / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  paint(ctx);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export function drawCard(
  ctx: CanvasRenderingContext2D,
  data: CardData,
  assets: CardAssets,
  scale: number,
  theme: CardTheme,
  backdrop?: CardBackdrop,
) {
  const { h } = CARD;
  const ink = theme.ink;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.clip(ticketPath());

  paintBackdrop(ctx, theme, backdrop);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Perforation.
  ctx.strokeStyle = withAlpha(ink, 0.7);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CARD.perf, CARD.notch + 14);
  ctx.lineTo(CARD.perf, h - CARD.notch - 14);
  ctx.stroke();

  // --- Header: circular mark, title, rule, subtitle ------------------------
  const logo = CARD.logo;
  const lcx = logo.x + logo.d / 2;
  const lcy = logo.y + logo.d / 2;
  if (assets.logo) {
    // The medallion has a transparent background and its own round rim; it's drawn a little
    // smaller than the logo box so the white ring below sits just outside the rim.
    const medal = logo.d - logo.ring * 2 + 2;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(assets.logo, lcx - medal / 2, lcy - medal / 2, medal, medal);
  } else {
    // Fallback if the image fails to load: an empty disc keeps the header balanced.
    ctx.fillStyle = withAlpha(CREAM, 0.25);
    ctx.beginPath();
    ctx.arc(lcx, lcy, logo.d / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = logo.ring;
  ctx.beginPath();
  ctx.arc(lcx, lcy, logo.d / 2 - logo.ring / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Title cap-top meets the mark's top; subtitle baseline meets its bottom.
  const headerMax = CARD.textRight - CARD.headerX;
  ctx.fillStyle = ink;
  const titleLeading = 27;
  const titleBase = logo.y + capHeight(TYPE.title.size);
  let titleWidth = 0;
  CARD.headline.forEach((line, i) => {
    const f = fit(ctx, assets, line.toUpperCase(), TYPE.title, headerMax);
    drawTracked(ctx, f.text, CARD.headerX, titleBase + titleLeading * i, f.tracking);
    if (i === 0) titleWidth = f.width;
  });
  const subBase = logo.y + logo.d;
  const subCapTop = subBase - capHeight(TYPE.subtitle.size);
  const line2Base = titleBase + titleLeading;
  const ruleY = (line2Base + subCapTop) / 2;
  ctx.fillStyle = withAlpha(ink, 0.7);
  ctx.fillRect(CARD.headerX, ruleY - 0.75, titleWidth, 1.5);
  ctx.fillStyle = withAlpha(ink, 0.94);
  const sub = fit(ctx, assets, CARD.subtitle.toUpperCase(), TYPE.subtitle, headerMax);
  drawTracked(ctx, sub.text, CARD.headerX, subBase, sub.tracking);

  // --- Name: given name light, surname heavy -------------------------------
  const { given, surname } = splitName(data.fullName);
  const nameMax = CARD.textRight - CARD.pad;
  ctx.fillStyle = ink;
  if (given) {
    const g = fit(ctx, assets, given, TYPE.given, nameMax);
    drawTracked(ctx, g.text, CARD.pad, CARD.name.givenBase, g.tracking);
  }
  const s = fit(ctx, assets, surname, TYPE.surname, nameMax);
  drawTracked(ctx, s.text, CARD.pad, given ? CARD.name.surnameBase : CARD.name.soloBase, s.tracking);

  // --- Photo (same top, radius, and edge as the QR box) --------------------
  const p = CARD.photo;
  ctx.save();
  roundRectPath(ctx, p.x, p.y, p.w, p.h, CARD.radius);
  ctx.clip();
  ctx.fillStyle = withAlpha(ink, 0.22);
  ctx.fillRect(p.x, p.y, p.w, p.h);
  if (assets.photo) drawCover(ctx, assets.photo, p.x, p.y, p.w, p.h, 0.5, 0.25);
  ctx.restore();
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = p.edge;
  roundRectPath(
    ctx,
    p.x + p.edge / 2,
    p.y + p.edge / 2,
    p.w - p.edge,
    p.h - p.edge,
    CARD.radius - p.edge / 2,
  );
  ctx.stroke();

  // --- MyLCI ID row: icon, label, number -----------------------------------
  const row = CARD.idRow;
  drawIcon(ctx, strokeBadgeCheck, ink, 2, 12, 12, CARD.iconCx, row.top + row.h / 2);
  ctx.fillStyle = withAlpha(ink, 0.92);
  const label = fit(ctx, assets, CARD.idLabel.toUpperCase(), TYPE.idLabel, CARD.contentRight - CARD.textX);
  drawTracked(ctx, label.text, CARD.textX, row.top + capHeight(label.size), label.tracking);
  ctx.fillStyle = ink;
  const number = fit(ctx, assets, data.mylciId?.trim() || "—", TYPE.idNumber, CARD.contentRight - CARD.textX);
  drawTracked(ctx, number.text, CARD.textX, row.bottom, number.tracking);

  // --- Rule ----------------------------------------------------------------
  ctx.fillStyle = withAlpha(ink, 0.6);
  ctx.fillRect(CARD.pad, CARD.ruleY - 0.75, CARD.contentRight - CARD.pad, 1.5);

  // --- Footer: calendar, role | term ---------------------------------------
  const f = CARD.footer;
  drawIcon(ctx, strokeBriefcase, ink, 2, 12, 12, CARD.iconCx, f.cy);
  const gap = 22;
  const dividerW = 1.5;
  ctx.fillStyle = ink;
  const term = fit(ctx, assets, data.term, TYPE.term, CARD.contentRight - CARD.textX);
  const roleMax = CARD.contentRight - CARD.textX - term.width - gap * 2 - dividerW;
  const role = fit(ctx, assets, data.roleLabel, TYPE.role, roleMax);
  const roleBase = f.cy + capHeight(role.size) / 2;
  drawTracked(ctx, role.text, CARD.textX, roleBase, role.tracking);
  const dividerX = CARD.textX + role.width + gap;
  ctx.fillStyle = withAlpha(ink, 0.85);
  ctx.fillRect(dividerX, f.cy - 16, dividerW, 32);
  // fit() also sets ctx.font, so re-run it to switch back to the term's font before drawing.
  const termDraw = fit(ctx, assets, data.term, TYPE.term, term.width);
  ctx.fillStyle = ink;
  drawTracked(
    ctx,
    termDraw.text,
    dividerX + dividerW + gap,
    f.cy + capHeight(termDraw.size) / 2,
    termDraw.tracking,
  );

  // --- Stub: QR, caption, vertical "UOCA ID" -------------------------------
  const q = CARD.qr;
  ctx.fillStyle = CREAM;
  roundRectPath(ctx, q.x, q.y, q.box, q.box, CARD.radius);
  ctx.fill();
  const area = qrModuleArea(data.qr);
  ctx.fillStyle = "#1a0f08";
  for (let r = 0; r < data.qr.size; r++) {
    for (let c = 0; c < data.qr.size; c++) {
      if (data.qr.isDark(r, c)) {
        // Overdraw by a hair so adjacent modules don't leave seams at fractional sizes.
        ctx.fillRect(area.x + c * area.cell, area.y + r * area.cell, area.cell + 0.25, area.cell + 0.25);
      }
    }
  }

  ctx.fillStyle = ink;
  const scan = fit(ctx, assets, CARD.scan.toUpperCase(), TYPE.scan, q.box);
  drawTracked(
    ctx,
    scan.text,
    CARD.stub.cx,
    q.y + q.box + CARD.stub.scanGap + capHeight(scan.size),
    scan.tracking,
    "center",
  );

  // Rotated 90° clockwise so it reads top-to-bottom, cap-height centred on the stub axis
  // and the last glyph ending on the footer's bottom edge.
  const stub = fit(ctx, assets, CARD.stubText, TYPE.stub, Infinity);
  ctx.save();
  ctx.translate(CARD.stub.cx - capHeight(stub.size) / 2, CARD.stub.textBottom);
  ctx.rotate(Math.PI / 2);
  drawTracked(ctx, stub.text, 0, 0, stub.tracking, "right");
  ctx.restore();

  ctx.restore();
}

/** The ID as a PNG with a paper margin, ready to download or share. */
export function renderCardPng(
  data: CardData,
  assets: CardAssets,
  theme: CardTheme,
  backdrop: CardBackdrop,
): Promise<Blob> {
  const S = CARD_SCALE;
  const M = EXPORT_MARGIN * S;
  const canvas = document.createElement("canvas");
  canvas.width = CARD.w * S + M * 2;
  canvas.height = CARD.h * S + M * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not supported in this browser."));

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(M, M);
  drawCard(ctx, data, assets, S, theme, backdrop);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create the image."))), "image/png");
  });
}
