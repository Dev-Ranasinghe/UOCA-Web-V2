"use client";

import { useSyncExternalStore } from "react";

/**
 * A live countdown to a moment in time, in days, hours, minutes and seconds.
 *
 * - The time comes from an external store (a timer), not from state set in an effect. The server renders "--" placeholders
 *   of the same size, so there is no hydration mismatch and no layout shift when the real numbers arrive.
 * - It reads the clock on every tick instead of subtracting one each second, so a throttled background tab is right
 *   again as soon as it wakes.
 * - `role="timer"` does not announce every tick to screen readers; the numbers carry their unit in a visually hidden label.
 */

function subscribe(onTick: () => void) {
  // Checked a few times a second so a tick is never skipped; React only re-renders when the whole second changes.
  const id = window.setInterval(onTick, 250);
  return () => window.clearInterval(id);
}
const nowInSeconds = () => Math.floor(Date.now() / 1000);
const notOnServer = () => null;

const pad = (n: number) => String(n).padStart(2, "0");

const UNITS = [
  { key: "days", short: "Days", long: "Days" },
  { key: "hours", short: "Hrs", long: "Hours" },
  { key: "minutes", short: "Min", long: "Minutes" },
  { key: "seconds", short: "Sec", long: "Seconds" },
] as const;

export default function Countdown({ until, doneText }: { until: string; doneText: string }) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, notOnServer);
  const target = Math.floor(new Date(until).getTime() / 1000);

  if (now !== null && now >= target) {
    return (
      <p role="status" className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-[#121212]">
        {doneText}
      </p>
    );
  }

  const left = now === null ? null : target - now;
  const values =
    left === null
      ? null
      : {
          days: Math.floor(left / 86400),
          hours: Math.floor((left % 86400) / 3600),
          minutes: Math.floor((left % 3600) / 60),
          seconds: left % 60,
        };

  return (
    <div role="timer" className="flex items-start justify-center gap-1.5 sm:gap-4">
      {UNITS.map((unit, index) => (
        <div key={unit.key} className="flex items-start gap-1.5 sm:gap-4">
          <div className="flex flex-col items-center">
            <span className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold leading-none tabular-nums tracking-tight text-[#121212] min-w-[2ch] text-center">
              <span className="sr-only">{values ? `${values[unit.key]} ${unit.long}` : ""}</span>
              <span aria-hidden="true">{values ? pad(values[unit.key]) : "--"}</span>
            </span>
            <span
              aria-hidden="true"
              className="mt-3 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-[2px] text-[#555]"
            >
              <span className="sm:hidden">{unit.short}</span>
              <span className="hidden sm:inline">{unit.long}</span>
            </span>
          </div>
          {index < UNITS.length - 1 ? (
            <span
              aria-hidden="true"
              className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold leading-none text-[#121212]/30"
            >
              :
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
