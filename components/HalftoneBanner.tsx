"use client";

import { useRef, useState } from "react";
import HalftoneFlow from "@/components/ui/halftone-flow";

export default function HalftoneBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [brightness, setBrightness] = useState(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = (e.clientY - rect.top) / rect.height;
    setBrightness(1 + (0.5 - y) * 0.3);
  };

  const handleMouseLeave = () => {
    setBrightness(1);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[220px] sm:h-[300px] lg:h-[380px] overflow-hidden bg-black cursor-default"
    >
      <HalftoneFlow
        className="absolute inset-0 h-full w-full transition-[filter] duration-300 ease-out"
        brightness={brightness}
      />
    </div>
  );
}
