import QRCode from "qrcode";

/**
 * Geometry for the UOCA ID card, in card units (the card is W × H units; the
 * canvas renderer multiplies everything by a scale factor). Every position below
 * is derived from a handful of anchors, so the alignments are structural rather
 * than eyeballed:
 *
 *  - PAD is the outer margin on all four sides of the content area.
 *  - The photo and the QR box share the same top edge (TOP), corner radius, and
 *    distance from the perforation (GUTTER) — they read as one matched pair.
 *  - The photo's bottom edge lands on the top of the MyLCI ID row.
 *  - The stub's "UOCA ID" and the footer row both end on BOTTOM.
 *  - Every row in the lower half shares one text column (TEXT_X).
 */
const W = 930;
const H = 525;
const PAD = 56;
const PERF = 690;
const GUTTER = 36;
const RADIUS = 14;
const TOP = PAD;
const BOTTOM = H - PAD;

const LOGO_D = 84;
const PHOTO_W = 210;
const PHOTO_H = 280;
const PHOTO_X = PERF - GUTTER - PHOTO_W;
const QR_BOX = 168;

/** Cap height as a fraction of font size (IBM Plex Sans). */
export const CAP = 0.698;
export const capHeight = (size: number) => size * CAP;

/** Type styles. `tracking` is in em. */
export const TYPE = {
  title: { size: 25, weight: 700, tracking: 0.08 },
  subtitle: { size: 16, weight: 500, tracking: 0.2 },
  given: { size: 34, weight: 500, tracking: 0.16 },
  surname: { size: 54, weight: 700, tracking: 0.01 },
  idLabel: { size: 14, weight: 600, tracking: 0.2 },
  idNumber: { size: 28, weight: 700, tracking: 0.2 },
  role: { size: 17, weight: 700, tracking: 0.14 },
  term: { size: 21, weight: 500, tracking: 0.1 },
  scan: { size: 15, weight: 700, tracking: 0.22 },
  stub: { size: 40, weight: 700, tracking: 0.08 },
} as const;

/** The ID row starts exactly where the photo ends. */
const ID_ROW_TOP = TOP + PHOTO_H;
const ID_ROW_H = 44;
const FOOTER_H = 40;
const FOOTER_TOP = BOTTOM - FOOTER_H;

export const CARD = {
  w: W,
  h: H,
  pad: PAD,
  radius: RADIUS,
  /** Concave corner cut-outs and the perforation notches. */
  cut: 28,
  notch: 26,
  perf: PERF,

  logo: { x: PAD, y: TOP, d: LOGO_D, ring: 3 },
  photo: { x: PHOTO_X, y: TOP, w: PHOTO_W, h: PHOTO_H, edge: 3 },
  qr: { x: PERF + GUTTER, y: TOP, box: QR_BOX, pad: 12 },

  /** Left content column: header text, name, and the rows below share these. */
  headerX: PAD + LOGO_D + 24,
  textRight: PHOTO_X - 28,
  /** Icons are centred on this axis (a 48-wide column starting at PAD); every row's text starts at textX. */
  iconCx: PAD + 24,
  textX: PAD + 70,
  /** Photo's right edge — the rule and footer stop here. */
  contentRight: PHOTO_X + PHOTO_W,

  name: {
    givenBase: 220,
    surnameBase: 276,
    /** Baseline when there is only one name, centred between header and ID row. */
    soloBase: Math.round((TOP + LOGO_D + ID_ROW_TOP) / 2 + capHeight(TYPE.surname.size) / 2),
  },
  idRow: { top: ID_ROW_TOP, h: ID_ROW_H, bottom: ID_ROW_TOP + ID_ROW_H },
  footer: { top: FOOTER_TOP, h: FOOTER_H, cy: FOOTER_TOP + FOOTER_H / 2, bottom: BOTTOM },
  /** Rule sits midway between the ID row and the footer row. */
  ruleY: Math.round((ID_ROW_TOP + ID_ROW_H + FOOTER_TOP) / 2),

  stub: { cx: (PERF + W) / 2, scanGap: 18, textBottom: BOTTOM },

  /** The club medallion: transparent PNG, cropped square around the medal. */
  logoSrc: "/images/uoca-logo.png",

  headline: ["Leo Club of UOC", "Alumni"],
  subtitle: "Official UOCA ID",
  scan: "Scan me",
  stubText: "UOCA ID",
  idLabel: "MyLCI ID number",
} as const;

/**
 * The ticket outline (concave corners + perforation notches) as an SVG path in a
 * 0–1 box, for a `clipPathUnits="objectBoundingBox"` clip. Mirrors `ticketPath()`
 * in draw-card.ts; the box scales x and y equally because the aspect ratio is fixed.
 */
export function ticketClipPathUnits(): string {
  const { w, h, cut, notch, perf } = CARD;
  const n = (v: number) => +v.toFixed(5);
  const x = (v: number) => n(v / w);
  const y = (v: number) => n(v / h);
  return [
    `M${x(cut)} 0`,
    `A${x(cut)} ${y(cut)} 0 0 1 0 ${y(cut)}`,
    `L0 ${y(h - cut)}`,
    `A${x(cut)} ${y(cut)} 0 0 1 ${x(cut)} 1`,
    `L${x(perf - notch)} 1`,
    `A${x(notch)} ${y(notch)} 0 0 1 ${x(perf + notch)} 1`,
    `L${x(w - cut)} 1`,
    `A${x(cut)} ${y(cut)} 0 0 1 1 ${y(h - cut)}`,
    `L1 ${y(cut)}`,
    `A${x(cut)} ${y(cut)} 0 0 1 ${x(w - cut)} 0`,
    `L${x(perf + notch)} 0`,
    `A${x(notch)} ${y(notch)} 0 0 1 ${x(perf - notch)} 0`,
    `L${x(cut)} 0Z`,
  ].join("");
}

/** Leo/Lions year runs 1 July – 30 June, e.g. Sep 2026 → "2026/27". */
export function currentLeoTerm(now: Date = new Date()): string {
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** "Secretary" → "SECRETARY OF UOCA". Doesn't add the suffix if the role already names UOCA. */
export function roleLabel(role: string | null): string {
  const base = (role?.trim() || "Member").toUpperCase();
  return /\bUOCA\b/.test(base) ? base : `${base} OF UOCA`;
}

/** Last word is the surname (set bold); anything before it is the given name(s). */
export function splitName(fullName: string): { given: string; surname: string } {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { given: "", surname: "MEMBER" };
  const surname = words[words.length - 1].toUpperCase();
  const given = words.slice(0, -1).join(" ").toUpperCase();
  return { given, surname };
}

export type QrMatrix = { size: number; isDark: (row: number, col: number) => boolean };

export function buildQr(text: string): QrMatrix {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  return { size: modules.size, isDark: (row, col) => modules.get(row, col) === 1 };
}

/** Where the QR modules go inside the white box, in card units. */
export function qrModuleArea(qr: QrMatrix) {
  const inner = CARD.qr.box - CARD.qr.pad * 2;
  return {
    x: CARD.qr.x + CARD.qr.pad,
    y: CARD.qr.y + CARD.qr.pad,
    cell: inner / qr.size,
  };
}

export function leoIdUrl(origin: string, memberId: string): string {
  return `${origin}/leo-id?member=${encodeURIComponent(memberId)}`;
}
