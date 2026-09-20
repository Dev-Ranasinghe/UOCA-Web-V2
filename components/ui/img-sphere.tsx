"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { X } from "lucide-react";

/**
 * SphereImageGrid: images arranged on a 3D sphere (Fibonacci distribution) that you can drag, with momentum,
 * optional auto-rotation, hover enlargement and a click-to-enlarge modal.
 *
 * Performance: the rotation lives in refs and every frame writes `transform`/`opacity` straight to the image nodes,
 * so React never re-renders while it spins (it used to `setState` about 60 times a second and re-layout 60 nodes with
 * left/top/width/height). The loop only runs while the sphere is on screen, in a visible tab, and is paced by elapsed
 * time so the speed does not depend on the frame rate.
 *
 * Touch: vertical swipes scroll the page (`touch-action: pan-y`); horizontal drags rotate. Mouse drags rotate freely.
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number; // Azimuth angle in degrees
  phi: number; // Polar angle in degrees
  radius: number; // Distance from center
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

export interface SphereImageGridProps {
  images?: ImageData[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
}

const toRad = (degrees: number) => degrees * (Math.PI / 180);

function normalizeAngle(angle: number) {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/** Fibonacci sphere distribution with a little randomness so it never looks like a perfect pattern. */
function buildSpherePositions(count: number, radius: number): SphericalPosition[] {
  const positions: SphericalPosition[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = (2 * Math.PI) / goldenRatio;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = angleIncrement * i;

    let phi = inclination * (180 / Math.PI);
    let theta = (azimuth * (180 / Math.PI)) % 360;

    // Reach closer to the poles without hitting the mathematical extremes.
    const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
    phi = phi < 90 ? Math.max(5, phi - poleBonus) : Math.min(175, phi + poleBonus);
    phi = 15 + (phi / 180) * 150;

    theta = (theta + (Math.random() - 0.5) * 20) % 360;
    phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));

    positions.push({ theta, phi, radius });
  }
  return positions;
}

/** Longest a single frame may advance the simulation, so a stalled tab doesn't make the sphere jump. */
const MAX_STEP_MS = 50;
/** Auto-rotation alone only changes slowly, so it is drawn at about 30 frames a second. Dragging and momentum run every frame. */
const IDLE_FRAME_MS = 32;

const subscribeNever = () => () => {};
/** False on the server and during hydration, true afterwards, without a setState in an effect. */
function useIsClient() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  images = [],
  containerSize = 400,
  sphereRadius = 200,
  dragSensitivity = 0.5,
  momentumDecay = 0.95,
  maxRotationSpeed = 5,
  baseImageScale = 0.12,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = false,
  autoRotateSpeed = 0.3,
  className = "",
}) => {
  const isMounted = useIsClient();
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rotation = useRef({ x: 15, y: 15 });
  const velocity = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, x: 0, y: 0, moved: 0 });
  const hovered = useRef<number | null>(null);
  const scales = useRef<number[]>([]);
  /** Set by the effect below so pointer handlers can draw a frame or restart the loop. */
  const controls = useRef({ render: () => {}, start: () => {} });
  /** Set by the effect below; the nodes call them from their hover events. */
  const hoverHandlers = useRef<{ enter: (index: number) => void; leave: (index: number) => void }>({
    enter: () => {},
    leave: () => {},
  }).current;

  const actualSphereRadius = sphereRadius || containerSize * 0.5;
  const baseImageSize = containerSize * baseImageScale;

  useEffect(() => {
    if (!isMounted) return;
    const container = containerRef.current;
    const count = images.length;
    if (!container || count === 0) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const spin = autoRotate && !reducedMotion;
    const positions = buildSpherePositions(count, actualSphereRadius);
    const clamp = (speed: number) => Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));

    const wx = new Float64Array(count);
    const wy = new Float64Array(count);
    const wz = new Float64Array(count);
    const ws = new Float64Array(count);
    const shown = new Uint8Array(count);
    const lastTransform: string[] = new Array(count).fill("");
    const lastOpacity: string[] = new Array(count).fill("");
    const lastZ: number[] = new Array(count).fill(NaN);

    /** Work out where every image is for the current rotation, then write it to the DOM. */
    function render() {
      const rotX = toRad(rotation.current.x);
      const rotY = toRad(rotation.current.y);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      for (let i = 0; i < count; i++) {
        const pos = positions[i];
        const theta = toRad(pos.theta);
        const phi = toRad(pos.phi);
        let x = pos.radius * Math.sin(phi) * Math.cos(theta);
        let y = pos.radius * Math.cos(phi);
        let z = pos.radius * Math.sin(phi) * Math.sin(theta);

        // Horizontal drag: rotate around Y. Vertical drag: rotate around X.
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        x = x1;
        z = z1;
        const y2 = y * cosX - z * sinX;
        const z2 = y * sinX + z * cosX;
        y = y2;
        z = z2;

        wx[i] = x;
        wy[i] = y;
        wz[i] = z;
        shown[i] = z > -30 ? 1 : 0;

        // Images from the poles are allowed to stay bigger toward the edge of the disc.
        const isPole = pos.phi < 30 || pos.phi > 150;
        const distanceRatio = Math.min(Math.sqrt(x * x + y * y) / actualSphereRadius, 1);
        const centerScale = Math.max(0.3, 1 - distanceRatio * (isPole ? 0.4 : 0.7));
        const depthScale = (z + actualSphereRadius) / (2 * actualSphereRadius);
        ws[i] = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);
      }

      // Shrink images that would overlap a neighbour on screen.
      for (let i = 0; i < count; i++) {
        if (!shown[i]) continue;
        let adjusted = ws[i];
        const size = baseImageSize * adjusted;
        for (let j = 0; j < count; j++) {
          if (i === j || !shown[j]) continue;
          const dx = wx[i] - wx[j];
          const dy = wy[i] - wy[j];
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (size + baseImageSize * ws[j]) / 2 + 25;
          if (distance < minDistance && distance > 0) {
            const overlap = minDistance - distance;
            adjusted = Math.min(adjusted, adjusted * Math.max(0.4, 1 - (overlap / minDistance) * 0.6));
          }
        }
        scales.current[i] = Math.max(0.25, adjusted);
      }

      for (let i = 0; i < count; i++) {
        const node = nodeRefs.current[i];
        if (!node) continue;
        if (!shown[i]) {
          if (lastOpacity[i] !== "hidden") {
            node.style.visibility = "hidden";
            lastOpacity[i] = "hidden";
          }
          continue;
        }
        const scale = scales.current[i] ?? ws[i];
        const transform = `translate3d(${wx[i].toFixed(1)}px,${wy[i].toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
        if (transform !== lastTransform[i]) {
          node.style.transform = transform;
          lastTransform[i] = transform;
        }
        const fade = wz[i] <= -10 ? Math.max(0, (wz[i] + 30) / 20) : 1;
        const opacity = fade.toFixed(2);
        if (opacity !== lastOpacity[i]) {
          node.style.opacity = opacity;
          node.style.visibility = "visible";
          lastOpacity[i] = opacity;
        }
        const zIndex = Math.round(1000 + wz[i]);
        if (zIndex !== lastZ[i]) {
          node.style.zIndex = String(zIndex);
          lastZ[i] = zIndex;
        }
      }

      if (hovered.current !== null) applyHover(hovered.current);
    }

    function applyHover(index: number) {
      const inner = innerRefs.current[index];
      if (!inner) return;
      const scale = scales.current[index] ?? 1;
      inner.style.transform = `scale(${Math.min(hoverScale, hoverScale / scale).toFixed(3)})`;
    }
    hoverHandlers.enter = (index) => {
      hovered.current = index;
      applyHover(index);
    };
    hoverHandlers.leave = (index) => {
      if (hovered.current === index) hovered.current = null;
      const inner = innerRefs.current[index];
      if (inner) inner.style.transform = "";
    };

    // ---- the loop: only while on screen and in a visible tab
    let raf = 0;
    let lastFrame = 0;
    let onScreen = true;

    function frame(now: number) {
      raf = 0;
      if (!onScreen) return;
      const first = lastFrame === 0;
      const elapsed = first ? 16.7 : now - lastFrame;
      const moving = drag.current.active || Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.01;
      if (!first && !moving && elapsed < IDLE_FRAME_MS - 2) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastFrame = now;
      const f = Math.min(elapsed, MAX_STEP_MS) / (1000 / 60);

      if (!drag.current.active) {
        const decay = Math.pow(momentumDecay, f);
        const { x: vx, y: vy } = velocity.current;
        rotation.current.y = normalizeAngle(rotation.current.y + ((spin ? autoRotateSpeed : 0) + clamp(vy)) * f);
        rotation.current.x = normalizeAngle(rotation.current.x + clamp(vx) * f);
        // Momentum fades out; below a whisper it stops (auto-rotation carries on regardless).
        const settled = Math.abs(vx * decay) < 0.01 && Math.abs(vy * decay) < 0.01;
        velocity.current = settled ? { x: 0, y: 0 } : { x: vx * decay, y: vy * decay };
      }
      render();

      // Keep going while there is anything to animate; a still, non-rotating sphere stops until touched.
      if (spin || moving || drag.current.active) raf = requestAnimationFrame(frame);
    }

    const start = () => {
      if (!raf && onScreen && !document.hidden) {
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    controls.current = {
      start,
      render: () => {
        if (raf) return;
        raf = requestAnimationFrame((now) => {
          raf = 0;
          lastFrame = now;
          render();
        });
      },
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "80px" },
    );
    io.observe(container);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    render();
    start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      controls.current = { render: () => {}, start: () => {} };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, images.length, actualSphereRadius, baseImageSize, autoRotate, autoRotateSpeed, momentumDecay, maxRotationSpeed, hoverScale]);

  const clampSpeed = (speed: number) => Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { active: true, x: event.clientX, y: event.clientY, moved: 0 };
    velocity.current = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      drag.current.moved += Math.abs(dx) + Math.abs(dy);
      const rx = clampSpeed(-dy * dragSensitivity);
      const ry = clampSpeed(dx * dragSensitivity);
      rotation.current.x = normalizeAngle(rotation.current.x + rx);
      rotation.current.y = normalizeAngle(rotation.current.y + ry);
      velocity.current = { x: rx, y: ry };
      controls.current.render();
    };
    const onEnd = () => {
      drag.current.active = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onEnd);
      document.removeEventListener("pointercancel", onEnd);
      // Let the momentum play out (and keep auto-rotation going).
      controls.current.start();
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onEnd);
    document.addEventListener("pointercancel", onEnd);
  };

  if (!isMounted) {
    return (
      <div
        className="bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!images.length) {
    return (
      <div
        className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        <div className="text-gray-400 text-center">
          <p>No images provided</p>
          <p className="text-sm">Add images to the images prop</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        ref={containerRef}
        className={`relative select-none cursor-grab active:cursor-grabbing ${className}`}
        style={{ width: containerSize, height: containerSize, perspective: `${perspective}px`, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
      >
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {images.map((image, index) => (
            <div
              key={image.id}
              ref={(el) => {
                nodeRefs.current[index] = el;
              }}
              className="absolute cursor-pointer select-none"
              style={{
                left: "50%",
                top: "50%",
                width: baseImageSize,
                height: baseImageSize,
                marginLeft: -baseImageSize / 2,
                marginTop: -baseImageSize / 2,
                visibility: "hidden",
                willChange: "transform, opacity",
              }}
              onMouseEnter={() => hoverHandlers.enter(index)}
              onMouseLeave={() => hoverHandlers.leave(index)}
              onClick={() => {
                // A drag that ends over an image is not a click on it.
                if (drag.current.moved > 4) return;
                setSelectedImage(image);
              }}
            >
              <div
                ref={(el) => {
                  innerRefs.current[index] = el;
                }}
                className="relative w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white/20 transition-transform duration-200 ease-out"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  draggable={false}
                  decoding="async"
                  loading={index < 3 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={() => setSelectedImage(null)}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s ease-out" }}
          >
            <div className="relative aspect-square">
              <img src={selectedImage.src} alt={selectedImage.alt} className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedImage(null)}
                aria-label="Close"
                className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 rounded-full text-white flex items-center justify-center hover:bg-opacity-70 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {(selectedImage.title || selectedImage.description) && (
              <div className="p-6">
                {selectedImage.title && <h3 className="text-xl font-bold mb-2 text-gray-900">{selectedImage.title}</h3>}
                {selectedImage.description && <p className="text-gray-600">{selectedImage.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SphereImageGrid;
