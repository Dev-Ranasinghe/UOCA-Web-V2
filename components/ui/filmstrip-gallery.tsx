"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Pause, Play, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilmstripImage {
  src: string
  /** Smaller file for the frames on the strip; `src` is kept for the preview. Falls back to `src`. */
  thumb?: string
  /** Real alt text: what is in the picture. */
  alt: string
  /** A short line about the photo. Not shown; it names the preview for screen readers. */
  caption?: string
  /** CSS object-position for the frame crop, e.g. `"50% 25%"` to keep faces in a portrait shot. */
  position?: string
}

export interface FilmstripGalleryProps extends Omit<React.ComponentProps<"section">, "children"> {
  images: FilmstripImage[]
  /** Frame in the gate at first paint. */
  defaultIndex?: number
  /** Width of one frame: CSS pixels or any CSS length (e.g. `"clamp(200px, 58vw, 300px)"`). Height follows `aspect`. */
  frameWidth?: number | string
  /** CSS aspect ratio of a frame, e.g. `"3 / 2"`. */
  aspect?: string
  /** Run the strip on its own, forever. Off for reduced-motion visitors until they press play. */
  autoPlay?: boolean
  /** How fast the strip runs, in frames per second. */
  speed?: number
  /** Text printed along the edge of the strip, the way film stock is. */
  film?: string
  /** Colour of the film base. */
  stripColor?: string
  /** Colour of the edge printing and the sprocket rims. */
  inkColor?: string
  /** Colour of the light around the frame in the gate. Defaults to `inkColor`. */
  gateColor?: string
  /** Colour seen through the sprocket holes: the surface the strip sits on. */
  holeColor?: string
  /** Previous / pause / next buttons under the strip. */
  showControls?: boolean
  /** Open a preview of the photo when the frame in the gate is clicked. */
  lightbox?: boolean
}

function useReducedMotion() {
  const subscribe = React.useCallback((notify: () => void) => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    mq.addEventListener("change", notify)
    return () => mq.removeEventListener("change", notify)
  }, [])
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

const mod = (n: number, m: number) => ((n % m) + m) % m
const pad = (n: number) => String(n).padStart(2, "0")

/** Gap between frames, px. The track's transform uses it too. */
const GAP = 8
/** Easing time constant when the strip is sent to a frame (arrows, a click, a flick, a pause), ms. */
const GLIDE_MS = 160
/** A pointer that moves further than this is a drag, not a click. */
const DRAG_SLOP = 6

/** Colour in the gate, black and white away from it; `d` is the distance from the gate in frames. */
function frameLook(d: number) {
  const t = Math.min(1, Math.abs(d))
  return {
    filter: `grayscale(${t.toFixed(3)}) brightness(${(1 - 0.28 * t).toFixed(3)}) contrast(${(1 + 0.08 * t).toFixed(3)})`,
    scale: (1 - 0.035 * t).toFixed(4),
    ring: Math.max(0, 1 - t * 2.5).toFixed(3),
  }
}

/** Sprocket holes: an SVG pattern of rounded rectangles that show the surface through the strip. */
function Perforation({ id, className }: { id: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={cn("block h-4 w-full", className)} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="22" height="16" patternUnits="userSpaceOnUse">
          <rect x="5" y="4" width="12" height="8" rx="2" fill="var(--fsg-hole)" stroke="var(--fsg-ink)" strokeOpacity="0.28" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

const stripControl =
  "grid size-11 cursor-pointer place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
const printControl =
  "grid size-11 cursor-pointer place-items-center rounded-full bg-[#121212] text-white transition-colors hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-[#121212]"

/**
 * Filmstrip Gallery — an endless strip of 35 mm frames that runs on its own in one smooth, steady glide.
 * Frames away from the gate are black and white; each one comes into colour as it slides into the
 * middle. The strip loops with no start or end (three copies of the roll, wrapped as it moves), can be
 * dragged or swiped, pauses on hover, focus, drag, when off screen and from its pause button. Clicking
 * the frame in the gate opens a preview card; clicking any other frame brings it to the gate.
 */
export function FilmstripGallery({
  images,
  defaultIndex = 0,
  frameWidth = 280,
  aspect = "3 / 2",
  autoPlay = true,
  speed = 0.75,
  film = "35MM · ISO 400",
  stripColor = "#1c1916",
  inkColor = "#eae7e1",
  gateColor,
  holeColor = "var(--color-background)",
  showControls = true,
  lightbox = true,
  className,
  style,
  "aria-label": ariaLabel = "Filmstrip gallery",
  ...rest
}: FilmstripGalleryProps) {
  const reduce = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const count = images.length
  const start = mod(defaultIndex, Math.max(1, count))

  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const trackRef = React.useRef<HTMLUListElement | null>(null)
  const frameRefs = React.useRef<(HTMLLIElement | null)[]>([])
  const dialogRef = React.useRef<HTMLDialogElement | null>(null)

  // The motion lives in refs and is written straight to the DOM each frame; React only renders on real changes.
  const pos = React.useRef(start) // current position, in frames, unbounded
  const target = React.useRef(start) // where the strip is easing to, when it has been sent somewhere
  const seeking = React.useRef(false) // true while easing to `target`; otherwise the strip runs at `speed`
  const wasHeld = React.useRef(false)
  const hovered = React.useRef(false)
  const focused = React.useRef(false)
  const visible = React.useRef(false)
  const drag = React.useRef<{ x: number; pos: number; pitch: number; moved: boolean; lastX: number; lastT: number; v: number } | null>(null)

  const [playing, setPlaying] = React.useState(autoPlay)
  const [gate, setGate] = React.useState(start)
  const [open, setOpen] = React.useState(false)
  const [printIndex, setPrintIndex] = React.useState(start)
  const pausedRef = React.useRef(!autoPlay)
  const openRef = React.useRef(false)
  React.useEffect(() => {
    pausedRef.current = !playing || reduce
  }, [playing, reduce])
  React.useEffect(() => {
    openRef.current = open
  }, [open])

  /** Put the track and every frame where `pos` says. */
  const paint = React.useCallback(() => {
    const track = trackRef.current
    if (!track || count === 0) return
    const p = count + mod(pos.current, count) // always inside the middle copy
    track.style.setProperty("--p", p.toFixed(4))
    frameRefs.current.forEach((li, j) => {
      if (!li) return
      const look = frameLook(j - p)
      li.style.setProperty("--fsg-filter", look.filter)
      li.style.setProperty("--fsg-scale", look.scale)
      li.style.setProperty("--fsg-ring", look.ring)
    })
  }, [count])

  React.useLayoutEffect(paint, [paint])

  // One loop: glide toward the target, rest in the gate, move on.
  React.useEffect(() => {
    if (count === 0) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (!drag.current) {
        const hold = pausedRef.current || hovered.current || focused.current || openRef.current || !visible.current
        // Stopping: ease onto the nearest frame so one sits in colour in the gate.
        if (hold && !wasHeld.current && !seeking.current) {
          target.current = Math.round(pos.current)
          seeking.current = true
        }
        wasHeld.current = hold
        if (seeking.current || hold) {
          const gap = target.current - pos.current
          if (reduce || Math.abs(gap) < 0.001) {
            pos.current = target.current
            seeking.current = false
          } else pos.current += gap * (1 - Math.exp(-dt / GLIDE_MS))
        } else {
          // Running: a steady glide, no stops.
          pos.current += (speed * dt) / 1000
          target.current = pos.current
        }
      }
      paint()
      const nearest = mod(Math.round(pos.current), count)
      setGate((g) => (g === nearest ? g : nearest))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [count, speed, paint, reduce])

  // Only run while the strip is on screen.
  React.useEffect(() => {
    const el = viewportRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      visible.current = true
      return
    }
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const step = (delta: number) => {
    target.current = Math.round(seeking.current ? target.current : pos.current) + delta
    seeking.current = true
  }

  /** Bring rendered frame `j` (in any copy) to the gate by the shortest way round. */
  const bringToGate = (j: number) => {
    const p = count + mod(pos.current, count)
    step(Math.round(j - p))
  }

  // --- drag / swipe ---------------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const first = frameRefs.current[0]
    const pitch = (first?.offsetWidth ?? 280) + GAP
    drag.current = { x: e.clientX, pos: pos.current, pitch, moved: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > DRAG_SLOP) {
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = (e.clientX - d.lastX) / dt
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    pos.current = target.current = d.pos - dx / d.pitch
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.moved) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    // A flick carries on a little, then lands on the nearest frame.
    target.current = Math.round(pos.current - (d.v * 160) / d.pitch)
    seeking.current = true
  }
  /** A click is a click only if the pointer did not travel. */
  const suppressClick = React.useRef(false)
  const onPointerUpCapture = () => {
    suppressClick.current = !!drag.current?.moved
  }

  const onFrameClick = (j: number) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    const i = mod(j, count)
    if (i === gate) openPrint(i)
    else bringToGate(j)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else return
    e.preventDefault()
  }

  // --- the preview -----------------------------------------------------------------------------
  const openPrint = (i: number) => {
    if (!lightbox) return
    setPrintIndex(i)
    setOpen(true)
  }
  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  const showPrint = (i: number) => setPrintIndex(mod(i, count))
  const closePrint = () => {
    setOpen(false)
    // Leave the strip on the photo that was being looked at.
    const p = mod(pos.current, count)
    let delta = printIndex - p
    if (delta > count / 2) delta -= count
    if (delta < -count / 2) delta += count
    target.current = pos.current = Math.round(pos.current + delta)
    seeking.current = false
  }
  const onDialogKey = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowRight") showPrint(printIndex + 1)
    if (e.key === "ArrowLeft") showPrint(printIndex - 1)
  }

  if (count === 0) return null

  const attrWidth = typeof frameWidth === "number" ? frameWidth : 300
  const [rw, rh] = aspect.split("/").map((v) => Number(v.trim()))
  const attrHeight = Math.round(attrWidth / (rw && rh ? rw / rh : 1.5))
  const fw = typeof frameWidth === "number" ? `${frameWidth}px` : frameWidth
  const running = playing && !reduce
  const print = images[printIndex]
  const initialP = count + start

  return (
    <section
      data-slot="filmstrip-gallery"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className={cn("relative w-full", className)}
      onMouseEnter={() => (hovered.current = true)}
      onMouseLeave={() => (hovered.current = false)}
      onFocus={(e) => {
        // Keyboard focus holds the strip still; a mouse click on a frame does not.
        const el = e.target as HTMLElement
        if (!el.closest("dialog") && el.matches(":focus-visible")) focused.current = true
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) focused.current = false
      }}
      style={
        {
          "--fsg-strip": stripColor,
          "--fsg-ink": inkColor,
          "--fsg-gate": gateColor ?? inkColor,
          "--fsg-hole": holeColor,
          "--fsg-fw": fw,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      <div className="relative w-full overflow-hidden rounded-md" style={{ background: "var(--fsg-strip)" }}>
        <Perforation id={`${uid}-top`} className="mt-1" />
        <div
          ref={viewportRef}
          role="group"
          aria-label="Frames. Use the arrow keys to move the strip."
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerUpCapture={onPointerUpCapture}
          onPointerCancel={endDrag}
          className="cursor-grab touch-pan-y overflow-hidden py-1 select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white active:cursor-grabbing"
        >
          <ul
            ref={trackRef}
            className="flex w-full will-change-transform"
            style={
              {
                gap: GAP,
                "--p": initialP,
                transform: `translate3d(calc(50% - var(--fsg-fw) / 2 - (var(--fsg-fw) + ${GAP}px) * var(--p)), 0, 0)`,
              } as React.CSSProperties
            }
          >
            {[0, 1, 2].flatMap((copy) =>
              images.map((image, i) => {
                const j = copy * count + i
                const look = frameLook(j - initialP)
                const inGate = copy === 1 && i === gate
                return (
                  <li
                    key={j}
                    ref={(node) => {
                      frameRefs.current[j] = node
                    }}
                    data-slot="frame"
                    aria-hidden={copy === 1 ? undefined : true}
                    className="relative shrink-0"
                    style={
                      {
                        width: "var(--fsg-fw)",
                        "--fsg-filter": look.filter,
                        "--fsg-scale": look.scale,
                        "--fsg-ring": look.ring,
                      } as React.CSSProperties
                    }
                  >
                    {/* Edge printing: frame number and stock, like the strip came back from the lab. */}
                    <div
                      aria-hidden="true"
                      className="flex h-3 items-center justify-between gap-2 px-0.5 font-mono text-[8px] uppercase tracking-[0.18em] opacity-70"
                      style={{ color: "var(--fsg-ink)" }}
                    >
                      <span>{pad(i + 1)}</span>
                      <span className="truncate">{i % 3 === 0 ? film : ""}</span>
                      <span>{pad(i + 1)}A</span>
                    </div>
                    <button
                      type="button"
                      tabIndex={copy === 1 && inGate ? 0 : -1}
                      aria-label={inGate ? `${image.alt}. Open the preview` : `Show ${image.alt}`}
                      onClick={() => onFrameClick(j)}
                      className={cn(
                        "relative block w-full overflow-hidden rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                        inGate && lightbox ? "cursor-zoom-in" : "cursor-pointer"
                      )}
                      style={{ aspectRatio: aspect }}
                    >
                      <img
                        src={image.thumb ?? image.src}
                        alt=""
                        width={attrWidth}
                        height={attrHeight}
                        decoding="async"
                        draggable={false}
                        className="pointer-events-none block h-full w-full object-cover"
                        style={{
                          objectPosition: image.position,
                          filter: "var(--fsg-filter)",
                          transform: "scale(var(--fsg-scale))",
                        }}
                      />
                      {/* The light through the gate. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[3px]"
                        style={{ boxShadow: "inset 0 0 0 2px var(--fsg-gate)", opacity: "var(--fsg-ring)" }}
                      />
                    </button>
                    <div aria-hidden="true" className="h-3" />
                  </li>
                )
              })
            )}
          </ul>
        </div>
        <Perforation id={`${uid}-bottom`} className="mb-1" />
        {/* The gate markers. */}
        <span aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 h-1.5 w-px -translate-x-1/2" style={{ background: "var(--fsg-gate)" }} />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2" style={{ background: "var(--fsg-gate)" }} />
      </div>

      {showControls ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button type="button" aria-label="Previous frame" onClick={() => step(-1)} className={stripControl}>
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={running ? "Pause the strip" : "Play the strip"}
            aria-pressed={!running}
            onClick={() => setPlaying((p) => (reduce ? true : !p))}
            className={stripControl}
          >
            {running ? (
              <Pause aria-hidden="true" className="size-4" strokeWidth={1.75} />
            ) : (
              <Play aria-hidden="true" className="size-4" strokeWidth={1.75} />
            )}
          </button>
          <button type="button" aria-label="Next frame" onClick={() => step(1)} className={stripControl}>
            <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}

      {/* The preview: a native dialog (focus, Escape and the backdrop for free), dressed as one of the site's cards. */}
      {lightbox ? (
        <dialog
          ref={dialogRef}
          data-slot="print"
          aria-label={`${print?.caption ?? print?.alt ?? "Photo"}, ${printIndex + 1} of ${count}`}
          onClose={closePrint}
          onKeyDown={onDialogKey}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
          className="m-auto max-h-[100dvh] w-full max-w-5xl bg-transparent p-3 text-[#121212] backdrop:bg-black/85 backdrop:backdrop-blur-sm sm:p-6"
        >
          {open && print ? (
            <div className="rounded-sm border border-[#121212] bg-[#f7f5f0] p-3 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] sm:p-5">
              <div className="card-header-line mb-3 sm:mb-4" aria-hidden="true">
                <span className="card-header-line-center" />
              </div>
              <div className="flex items-center justify-center overflow-hidden rounded-sm border border-[#121212] bg-[#121212]">
                <img
                  key={print.src}
                  src={print.src}
                  alt={print.alt}
                  className="block max-h-[62dvh] w-auto max-w-full object-contain sm:max-h-[68dvh]"
                />
              </div>
              <div className="mt-3 flex items-center justify-center sm:mt-4">
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Previous photo" onClick={() => showPrint(printIndex - 1)} className={printControl}>
                    <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </button>
                  <button type="button" aria-label="Next photo" onClick={() => showPrint(printIndex + 1)} className={printControl}>
                    <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className={cn(printControl, "ml-1 border border-[#121212] bg-transparent text-[#121212] hover:bg-[#121212] hover:text-white")}
                  >
                    <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </dialog>
      ) : null}
    </section>
  )
}

export default FilmstripGallery
