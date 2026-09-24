import { cn } from "@/lib/utils"

interface FilmEdgeProps {
  /** Which edge of the dark section this sits on. */
  side: "top" | "bottom"
  /** What shows through the sprocket holes: the light section next door. */
  holeColor?: string
  className?: string
}

/**
 * A row of sprocket holes along the top or bottom of a dark section, so the section's edge reads as the rim
 * of a film roll where it meets the light sections around it. Put it inside a `relative` section; it
 * adds no height of its own. Server-safe: plain SVG, no script.
 */
export function FilmEdge({ side, holeColor = "#eae7e1", className }: FilmEdgeProps) {
  const id = `film-edge-${side}`
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 block h-7 w-full",
        side === "top" ? "top-0" : "bottom-0",
        className
      )}
      preserveAspectRatio="none"
    >
      <defs>
        {/* A 28px band, 26px pitch; holes 14 x 10 with rounded corners, centred in the band. */}
        <pattern id={id} width="26" height="28" patternUnits="userSpaceOnUse">
          <rect x="6" y="9" width="14" height="10" rx="2.5" fill={holeColor} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export default FilmEdge
