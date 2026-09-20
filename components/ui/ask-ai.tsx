"use client";

import * as React from "react";
import { Popover as PopoverPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Building blocks from the "Ask AI" component: the popover shell, the tooltip and the blinking blob mascot.
 * LYNX (components/lynx) is built from these. The component's "open ChatGPT / Claude / Grok / Perplexity" buttons
 * are left out on purpose: LYNX is a UOCA-only assistant and shouldn't send visitors to other chatbots.
 */

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />;
}

export function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

export function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 0,
  hideArrow = false,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  hideArrow?: boolean;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        {!hideArrow && (
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export type MascotGaze = "up" | "down" | "left" | "right";

export function AIMascot({
  awake = false,
  gaze,
  size = "default",
  brand = false,
  className,
}: {
  awake?: boolean;
  /** Direction the eyes look while awake: point it at the popover. */
  gaze?: MascotGaze;
  size?: "default" | "compact";
  brand?: boolean;
  className?: string;
}) {
  const eyeShift = !awake
    ? "translate-x-px -translate-y-px"
    : gaze === "down"
      ? "translate-x-px translate-y-1"
      : gaze === "left"
        ? "-translate-x-1 -translate-y-px"
        : gaze === "right"
          ? "translate-x-1 -translate-y-px"
          : "translate-x-px -translate-y-1";

  return (
    <span
      aria-hidden="true"
      data-awake={awake}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground animate-[ai-mascot-blob_9s_ease-in-out_infinite] motion-reduce:animate-none transition-transform duration-[440ms] ease-[cubic-bezier(.22,1.5,.5,1)]",
        brand
          ? "h-[22px] w-[22px] shadow-none"
          : size === "compact"
            ? "h-7 w-7 shadow-none"
            : "h-10 w-10 rotate-[-7deg] data-[awake=true]:rotate-6 data-[awake=true]:scale-[1.05]",
        className,
      )}
    >
      <span
        // Optional: a parent can set --mascot-look-x / --mascot-look-y (px) to make the eyes look somewhere, for
        // example toward the cursor. It adds to the gaze above and does nothing when the variables aren't set.
        style={{ transform: "translate(var(--mascot-look-x, 0px), var(--mascot-look-y, 0px))" }}
        className={cn(
          "flex transition-transform duration-300",
          brand ? "gap-1" : size === "compact" ? "gap-[5px]" : cn("gap-2 transition-transform", eyeShift),
        )}
      >
        <span
          className={cn(
            "block animate-[ai-mascot-blink_6.5s_infinite] motion-reduce:animate-none rounded-[5px] bg-current",
            brand ? "h-[5px] w-[2.5px]" : size === "compact" ? "h-[7px] w-[3px]" : "h-2.5 w-1",
          )}
        />
        <span
          className={cn(
            "block animate-[ai-mascot-blink_6.5s_infinite] motion-reduce:animate-none rounded-[5px] bg-current",
            brand ? "h-[5px] w-[2.5px]" : size === "compact" ? "h-[7px] w-[3px]" : "h-2.5 w-1",
          )}
        />
      </span>
      <style>{`
        @keyframes ai-mascot-blob {
          0%, 100% { border-radius: 58% 42% 55% 45% / 52% 58% 42% 48%; }
          33% { border-radius: 45% 55% 48% 52% / 58% 44% 56% 42%; }
          66% { border-radius: 52% 48% 42% 58% / 45% 52% 48% 55%; }
        }
        @keyframes ai-mascot-blink {
          0%, 42%, 46%, 100% { transform: scaleY(1); }
          44% { transform: scaleY(.12); }
        }
      `}</style>
    </span>
  );
}
