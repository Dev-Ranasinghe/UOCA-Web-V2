import React from "react";

/**
 * A black strip of text that scrolls sideways forever (styles: `.ticker` in globals.css).
 *
 * - The row is repeated so it is always wider than the screen; the track slides by exactly one repeat and starts over,
 *   which reads as one endless line. Only `transform` animates, so it costs nothing while the page scrolls.
 * - The speed is the same in pixels per second for any text: the duration is worked out from how long the row is.
 * - Screen readers hear the items once; the repeats are `aria-hidden`.
 * - Paused on hover; static (one row, scrollable sideways) for reduced motion.
 */

/** Enough repeats to cover a very wide screen plus the one repeat that slides out. */
const COPIES = 6;
/** Rough size of the row, to turn a speed into a duration: an average character and the padding + divider around an item. */
const CHAR_PX = 8;
const ITEM_PX = 88;
const SPEED_PX_PER_S = 42;

export default function Ticker({
  items,
  label,
  reverse = false,
  className = "",
}: {
  items: string[];
  /** What the strip says, for screen readers (the visible text is repeated). */
  label: string;
  /** Scroll to the right instead of to the left. */
  reverse?: boolean;
  className?: string;
}) {
  const rowPx = items.reduce((sum, item) => sum + item.length * CHAR_PX + ITEM_PX, 0);
  const seconds = Math.round(rowPx / SPEED_PX_PER_S);

  return (
    <div
      className={`ticker w-full bg-[#0d0d0d] text-white text-xs font-mono border-t border-b border-[#121212] ${className}`}
      role="group"
      aria-label={label}
    >
      <div className="ticker-fade">
        <div
          className="ticker-track flex w-max items-center py-2.5"
          style={
            {
              "--ticker-shift": `${(-100 / COPIES).toFixed(4)}%`,
              animationDuration: `${seconds}s`,
              animationDirection: reverse ? "reverse" : "normal",
            } as React.CSSProperties
          }
        >
          {Array.from({ length: COPIES }, (_, copy) => (
            <div key={copy} className="ticker-copy flex shrink-0 items-center" aria-hidden={copy > 0 ? true : undefined}>
              {items.map((item) => (
                <React.Fragment key={item}>
                  <span className="whitespace-nowrap px-6 md:px-8 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                    {item}
                  </span>
                  <span aria-hidden="true" className="font-normal text-[#444]">
                    |
                  </span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
