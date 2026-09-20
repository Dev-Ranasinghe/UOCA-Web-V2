"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { getImageProps } from "next/image";
import { IBM_Plex_Sans } from "next/font/google";
import { Download, RefreshCw, Share2 } from "lucide-react";
import {
  Dithering,
  PRESERVE_BUFFER,
  TICKET_STYLE,
  playShutterSound,
  remixTicketStyle,
  usePrefersReducedMotion,
} from "@/components/ui/admit-one-ticket";
import {
  CARD,
  buildQr,
  currentLeoTerm,
  leoIdUrl,
  roleLabel,
  ticketClipPathUnits,
} from "@/lib/leo-id/card-layout";
import {
  CARD_SCALE,
  drawCard,
  loadCardAssets,
  renderCardPng,
  themeFor,
  type CardAssets,
  type CardData,
} from "./draw-card";

const CLIP_ID = "uoca-id-ticket-clip";

// admit-one-ticket.jsx is untyped JS, so give the shader's props a shape here.
const LiveDithering = Dithering as ComponentType<Record<string, unknown>>;

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LeoIdCard({
  memberId,
  fullName,
  role,
  mylciId,
  photoUrl,
}: {
  memberId: string;
  fullName: string;
  role: string | null;
  mylciId: string | null;
  photoUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shaderBoxRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [style, setStyle] = useState(TICKET_STYLE);
  const theme = useMemo(() => themeFor(style.texture.colorBack), [style.texture.colorBack]);
  const assetsRef = useRef<CardAssets | null>(null);
  const [origin, setOrigin] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
  }, []);

  // Same-origin, resized copies — safe to draw into the export canvas.
  const photoSrc = useMemo(
    () => getImageProps({ src: photoUrl, alt: "", width: 640, height: 800 }).props.src,
    [photoUrl],
  );
  const logoSrc = useMemo(
    () => getImageProps({ src: CARD.logoSrc, alt: "", width: 384, height: 384 }).props.src,
    [],
  );

  const data = useMemo<CardData | null>(
    () =>
      origin
        ? {
            fullName,
            roleLabel: roleLabel(role),
            term: currentLeoTerm(),
            mylciId,
            qr: buildQr(leoIdUrl(origin, memberId)),
          }
        : null,
    [origin, fullName, role, mylciId, memberId],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !data) return;
    let cancelled = false;
    (async () => {
      try {
        const assets =
          assetsRef.current ??
          (await loadCardAssets({ fontFamily: plex.style.fontFamily, photoSrc, logoSrc }));
        if (cancelled) return;
        assetsRef.current = assets;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCard(ctx, data, assets, CARD_SCALE, theme);
        setReady(true);
      } catch (e) {
        console.error("UOCA ID card failed to draw", e);
        if (!cancelled) setError("The ID card couldn't be drawn. Please refresh and try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, theme, photoSrc, logoSrc]);

  async function run(kind: "download" | "share") {
    if (!data || !assetsRef.current) return;
    setBusy(kind);
    setError(null);
    try {
      // The shader canvas holds the frame currently on screen.
      const shader = shaderBoxRef.current?.querySelector("canvas") ?? null;
      const blob = await renderCardPng(data, assetsRef.current, theme, {
        colorBack: style.texture.colorBack,
        shader,
      });
      const filename = `uoca-id-${slugify(fullName) || "member"}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (kind === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${fullName} — UOCA ID`,
          text: `${fullName}'s UOCA ID`,
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      // Dismissing the share sheet rejects with AbortError — not a failure.
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong creating the image.");
    } finally {
      setBusy(null);
    }
  }

  const buttonClass =
    "inline-flex items-center gap-2 border border-[#121212] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50";
  const solid = `${buttonClass} bg-[#121212] text-white hover:bg-[#333]`;

  return (
    <div>
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={ticketClipPathUnits()} />
          </clipPath>
        </defs>
      </svg>

      {/* Shadow lives on the outer box so it follows the clipped ticket outline. */}
      <div className="mx-auto w-full max-w-[930px] drop-shadow-[0_10px_18px_rgba(120,45,10,0.22)]">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${CARD.w} / ${CARD.h}`, clipPath: `url(#${CLIP_ID})` }}
        >
          <div className="absolute inset-0" style={{ background: style.texture.colorBack }} />
          {/* The original live "warp" dithering background. */}
          <div ref={shaderBoxRef} className="absolute inset-0" aria-hidden="true">
            <LiveDithering
              webGlContextAttributes={PRESERVE_BUFFER}
              colorBack={style.texture.colorBack}
              colorFront={style.texture.colorFront}
              shape={style.texture.shape}
              type={style.texture.type}
              size={style.texture.size}
              scale={style.texture.scale}
              rotation={style.texture.rotation}
              offsetX={style.texture.offsetX}
              offsetY={style.texture.offsetY}
              speed={reducedMotion ? 0 : style.texture.speed}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          </div>
          <canvas
            ref={canvasRef}
            width={CARD.w * CARD_SCALE}
            height={CARD.h * CARD_SCALE}
            role="img"
            aria-label={`UOCA ID card for ${fullName}${role ? `, ${role}` : ""}${mylciId ? `, MyLCI ID ${mylciId}` : ""}`}
            className={`absolute inset-0 size-full transition-opacity duration-300 motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" disabled={!ready || busy !== null} onClick={() => run("download")} className={solid}>
          <Download className="size-3.5" />
          {busy === "download" ? "Creating…" : "Download image"}
        </button>
        {canShare ? (
          <button type="button" disabled={!ready || busy !== null} onClick={() => run("share")} className={solid}>
            <Share2 className="size-3.5" />
            {busy === "share" ? "Creating…" : "Share"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setStyle((prev) => remixTicketStyle(prev));
            playShutterSound();
          }}
          className={`${buttonClass} bg-transparent text-[#121212] hover:bg-[#121212] hover:text-white`}
        >
          <RefreshCw className="size-3.5" />
          Remix style
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-center font-sans text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[2px] text-[#555]">
        The image includes a QR code that opens this ID.
      </p>
    </div>
  );
}
