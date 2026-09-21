"use client";

import type React from "react";
import { Suspense, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * InfiniteGallery: photos drift toward the camera through a dark tunnel, blurring and fading in at the far end and out
 * as they pass. Idle, they drift on their own; after any scrolling they wait 3 seconds and drift again.
 *
 * Scroll-driven, on purpose. The original 21st.dev component cancelled the wheel on its canvas, which only works for a
 * page that is nothing but the gallery. Here the parent pins the gallery with `position: sticky` inside a tall track and
 * passes `progressRef` (0 at the top of the track, 1 at the bottom). The page holds still while progress goes 0 → 1 and
 * every photo passes the camera; once it reaches 1 the page scrolls on. Because it is ordinary scrolling, the wheel,
 * touch swipes, the keyboard, the scrollbar and anchor links all work, and nothing can trap the visitor.
 *
 * Positions are computed from the travel distance each frame (no per-plane state), so scrolling back up is exact. All
 * the moving parts are written straight to the meshes, so React does not re-render while it animates, and
 * `active={false}` stops the render loop when the section is off screen.
 */

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
  fadeIn: { start: number; end: number };
  fadeOut: { start: number; end: number };
}

interface BlurSettings {
  blurIn: { start: number; end: number };
  blurOut: { start: number; end: number };
  maxBlur: number;
}

interface InfiniteGalleryProps {
  images: ImageItem[];
  /** Scroll progress through the pinned track, 0 to 1. Without it the gallery only drifts. */
  progressRef?: React.RefObject<number>;
  /** Scales the idle drift. */
  speed?: number;
  /** How many photo planes exist at once. */
  visibleCount?: number;
  fadeSettings?: FadeSettings;
  blurSettings?: BlurSettings;
  /** False pauses the render loop (off-screen sections). */
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;
const MAX_VELOCITY = 4;
const DRIFT_SPEED = 1; // depth units per second while idle (times `speed`)
const AUTOPLAY_RESUME_MS = 3000;

const DEFAULT_FADE: FadeSettings = {
  fadeIn: { start: 0.05, end: 0.25 },
  fadeOut: { start: 0.4, end: 0.43 },
};

const DEFAULT_BLUR: BlurSettings = {
  blurIn: { start: 0.0, end: 0.1 },
  blurOut: { start: 0.4, end: 0.43 },
  maxBlur: 8.0,
};

const normalize = (images: ImageItem[]) =>
  images.map((img) => (typeof img === "string" ? { src: img, alt: "" } : { src: img.src, alt: img.alt ?? "" }));

/** 0 → 1 across [start, end], clamped. */
const ramp = (value: number, start: number, end: number) =>
  end === start ? (value < start ? 0 : 1) : Math.min(1, Math.max(0, (value - start) / (end - start)));

const createClothMaterial = () =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Bend the plane with the scroll force
        float curveIntensity = scrollForce * 0.3;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;

        // Gentle cloth ripples
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;

        // Flag wave while hovered, strongest on the free (right) edge
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = sin(wavePhase) * 0.1 * dampening;
          flagWave += sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
        }

        pos.z -= (curve + clothEffect + flagWave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(map, vUv);

        // Cheap 5x5 blur, only while a plane is blurred
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;

          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }

        // Faint lift while curving
        color.rgb += vec3(abs(scrollForce) * 0.005);

        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  });

function GalleryScene({
  images,
  progressRef,
  speed = 1,
  visibleCount = 8,
  fadeSettings = DEFAULT_FADE,
  blurSettings = DEFAULT_BLUR,
  reducedMotion,
}: Pick<
  InfiniteGalleryProps,
  "images" | "progressRef" | "speed" | "visibleCount" | "fadeSettings" | "blurSettings"
> & { reducedMotion: boolean }) {
  const gl = useThree((state) => state.gl);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  // Everything that changes per frame lives here so React never re-renders while it animates.
  const motion = useRef({
    smoothed: 0, // eased copy of the scroll travel
    drift: 0, // current idle drift speed
    driftTravel: 0, // distance covered by drifting
    lastTravel: 0,
    velocity: 0,
    lastProgress: -1,
    lastInteraction: -Infinity,
  });

  const normalizedImages = useMemo(() => normalize(images), [images]);
  const totalImages = normalizedImages.length;

  const textures = useTexture(
    normalizedImages.map((img) => img.src),
    (loaded) => {
      (Array.isArray(loaded) ? loaded : [loaded]).forEach((tex) => {
        tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      });
    },
  );

  const materials = useMemo(() => Array.from({ length: visibleCount }, () => createClothMaterial()), [visibleCount]);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  // Golden-angle scatter so neighbouring planes never line up
  const spatialPositions = useMemo(
    () =>
      Array.from({ length: visibleCount }, (_, i) => {
        const horizontalAngle = (i * 2.618) % (Math.PI * 2);
        const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);
        const horizontalRadius = (i % 3) * 1.2;
        const verticalRadius = ((i + 1) % 4) * 0.8;
        return {
          x: (Math.sin(horizontalAngle) * horizontalRadius * MAX_HORIZONTAL_OFFSET) / 3,
          y: (Math.cos(verticalAngle) * verticalRadius * MAX_VERTICAL_OFFSET) / 4,
        };
      }),
    [visibleCount],
  );

  const spacing = DEPTH_RANGE / Math.max(visibleCount, 1);
  // Depth travelled from the first frame to the last: every photo enters at the far end and leaves through the near fade.
  const completeTravel = totalImages * spacing + fadeSettings.fadeOut.end * DEPTH_RANGE;
  // A plane that wraps takes the image the plane `visibleCount` slots on would have shown, so neighbours stay consecutive.
  const imageAdvance = totalImages > 0 ? visibleCount % totalImages || totalImages : 0;

  useFrame((state, delta) => {
    if (totalImages === 0) return;
    const dt = Math.min(delta, 0.05);
    const m = motion.current;
    const now = performance.now();

    // Scroll travel, eased so wheel notches and touch flicks glide instead of stepping.
    const progress = progressRef?.current ?? 0;
    const target = progress * completeTravel;
    if (m.lastProgress < 0 || reducedMotion) m.smoothed = target;
    else m.smoothed += (target - m.smoothed) * (1 - Math.exp(-dt * 6));
    if (Math.abs(progress - m.lastProgress) > 1e-4) m.lastInteraction = now;
    m.lastProgress = progress;

    // Idle drift eases in after AUTOPLAY_RESUME_MS without scrolling and stops as soon as scrolling resumes.
    const idle = !reducedMotion && now - m.lastInteraction > AUTOPLAY_RESUME_MS;
    m.drift += ((idle ? DRIFT_SPEED * speed : 0) - m.drift) * (1 - Math.exp(-dt * 1.5));
    m.driftTravel += m.drift * dt;

    const travel = m.smoothed + m.driftTravel;
    const rawVelocity = THREE.MathUtils.clamp((travel - m.lastTravel) / Math.max(dt, 1e-3) / 10, -MAX_VELOCITY, MAX_VELOCITY);
    m.lastTravel = travel;
    m.velocity += (rawVelocity - m.velocity) * (1 - Math.exp(-dt * 10));

    const time = state.clock.getElapsedTime();
    const aspect = state.size.width / Math.max(state.size.height, 1);
    // Narrow (phone) views see far less width at the same depth, so pull the scatter toward the middle.
    const spread = THREE.MathUtils.clamp(aspect / 1.6, 0.4, 1);
    const halfRange = DEPTH_RANGE / 2;
    const { fadeIn, fadeOut } = fadeSettings;
    const { blurIn, blurOut, maxBlur } = blurSettings;

    materials.forEach((material, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;

      const raw = spacing * i + travel;
      const wraps = Math.floor(raw / DEPTH_RANGE);
      const z = raw - wraps * DEPTH_RANGE;
      const imageIndex = (((i + wraps * imageAdvance) % totalImages) + totalImages) % totalImages;
      const t = z / DEPTH_RANGE; // 0 (far) → 1 (behind the camera)

      // Opacity: 0 before fadeIn, up across it, 1 in between, down across fadeOut, 0 after
      const opacity =
        t < fadeIn.end
          ? ramp(t, fadeIn.start, fadeIn.end)
          : t < fadeOut.start
            ? 1
            : 1 - ramp(t, fadeOut.start, fadeOut.end);

      // Blur: full before blurIn ends, none in the middle, full again across blurOut
      const blur =
        t < blurIn.end
          ? maxBlur * (1 - ramp(t, blurIn.start, blurIn.end))
          : t < blurOut.start
            ? 0
            : maxBlur * ramp(t, blurOut.start, blurOut.end);

      const texture = textures[imageIndex];
      const image = texture?.image as { width: number; height: number } | undefined;
      const imageAspect = image ? image.width / image.height : 1;

      mesh.visible = opacity > 0.002;
      mesh.position.set((spatialPositions[i]?.x ?? 0) * spread, spatialPositions[i]?.y ?? 0, z - halfRange);
      if (imageAspect > 1) mesh.scale.set(2 * imageAspect, 2, 1);
      else mesh.scale.set(2, 2 / imageAspect, 1);

      const { uniforms } = material;
      if (uniforms.map.value !== texture) uniforms.map.value = texture;
      uniforms.opacity.value = opacity;
      uniforms.blurAmount.value = blur;
      uniforms.scrollForce.value = m.velocity;
      uniforms.time.value = time;
    });
  });

  if (totalImages === 0) return null;

  return (
    <>
      {materials.map((material, i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          visible={false}
          material={material}
          onPointerEnter={() => {
            material.uniforms.isHovered.value = 1;
          }}
          onPointerLeave={() => {
            material.uniforms.isHovered.value = 0;
          }}
        >
          <planeGeometry args={[1, 1, 32, 32]} />
        </mesh>
      ))}
    </>
  );
}

// WebGL check and reduced-motion preference, read without effects so nothing re-renders after mount.
let webglSupport: boolean | null = null;
const detectWebgl = () => {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
};
const subscribeNone = () => () => {};
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

function FallbackGallery({ images }: { images: ImageItem[] }) {
  return (
    <div className="grid h-full grid-cols-2 gap-2 overflow-y-auto bg-black p-4 md:grid-cols-4">
      {normalize(images).map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.src} alt={img.alt} loading="lazy" className="aspect-[3/2] w-full object-cover" />
      ))}
    </div>
  );
}

export default function InfiniteGallery({
  images,
  progressRef,
  speed = 1,
  visibleCount = 8,
  fadeSettings = DEFAULT_FADE,
  blurSettings = DEFAULT_BLUR,
  active = true,
  className = "h-96 w-full",
  style,
}: InfiniteGalleryProps) {
  const webglSupported = useSyncExternalStore(subscribeNone, detectWebgl, () => true);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  return (
    <div className={className} style={style}>
      {webglSupported ? (
        <Canvas
          camera={{ position: [0, 0, 0], fov: 55 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
          frameloop={active ? "always" : "never"}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <GalleryScene
              images={images}
              progressRef={progressRef}
              speed={speed}
              visibleCount={visibleCount}
              fadeSettings={fadeSettings}
              blurSettings={blurSettings}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        </Canvas>
      ) : (
        <FallbackGallery images={images} />
      )}
      {/* The canvas is decorative; this is what assistive tech reads. */}
      <ul className="sr-only">
        {normalize(images).map((img, i) => (
          <li key={i}>{img.alt}</li>
        ))}
      </ul>
    </div>
  );
}
