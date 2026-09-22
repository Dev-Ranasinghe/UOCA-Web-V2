"use client";

import { useEffect, useRef } from "react";

/**
 * A slow, dithered pixel plasma in the admin palette (raw WebGL1, no dependencies), used as the dashboard's "site
 * status" portrait. The blob drifts on its own and leans toward the pointer or finger. `mood` swaps the palette:
 * the full UOCA set while the site is live, a pink/yellow warning set while maintenance mode is on.
 *
 * Pauses off-screen and in background tabs, draws a single still frame for reduced-motion users, and leaves the
 * container's own background showing if WebGL is unavailable.
 */

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_cell;
uniform vec2 u_pointer;
uniform vec3 u_c0; uniform vec3 u_c1; uniform vec3 u_c2;
uniform vec3 u_c3; uniform vec3 u_c4; uniform vec3 u_c5;

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

vec3 pick(float i) {
  if (i < 1.0) return u_c0;
  if (i < 2.0) return u_c1;
  if (i < 3.0) return u_c2;
  if (i < 4.0) return u_c3;
  if (i < 5.0) return u_c4;
  return u_c5;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_cell);
  vec2 p = (cell * u_cell) / u_res.y * 3.0;
  vec2 m = u_pointer * vec2(u_res.x / u_res.y, 1.0) * 3.0;
  float t = u_time * 0.35;

  float v = sin(p.x * 1.6 + t)
          + sin(p.y * 2.1 - t * 1.3)
          + sin((p.x + p.y) * 1.2 + t * 0.7)
          + 1.6 * sin(length(p - m) * 2.6 - t * 1.8);
  v = clamp(v / 9.2 + 0.5, 0.0, 1.0);

  float d = bayer4(cell) - 0.5;
  float idx = floor(clamp(v + d * 0.22, 0.0, 0.999) * 6.0);
  vec3 color = pick(idx);

  // A hairline of ink between pixels, like the grid of a sprite.
  vec2 f = fract(gl_FragCoord.xy / u_cell);
  float edge = step(f.x, 1.0 / u_cell) + step(f.y, 1.0 / u_cell);
  color = mix(color, u_c0, min(edge, 1.0) * 0.35);

  gl_FragColor = vec4(color, 1.0);
}
`;

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;

const PALETTES: Record<"live" | "maintenance", RGB[]> = {
  live: ["#161616", "#8fa6d9", "#b99ce9", "#72c89b", "#f2c64a", "#f19a9b"].map(hex),
  maintenance: ["#161616", "#5a2323", "#c7372b", "#f19a9b", "#fbe7a6", "#f2c64a"].map(hex),
};

export function PixelField({
  mood = "live",
  cellSize = 11,
  className,
}: {
  mood?: "live" | "maintenance";
  cellSize?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("PixelField shader failed to compile:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("PixelField program failed to link:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("u_res");
    const uTime = u("u_time");
    const uCell = u("u_cell");
    const uPointer = u("u_pointer");
    PALETTES[mood].forEach((c, i) => gl.uniform3fv(u(`u_c${i}`), c));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // The pointer target and the eased value the shader sees (0..1, origin bottom-left like gl_FragCoord).
    const target = { x: 0.5, y: 0.5 };
    const eased = { x: 0.5, y: 0.5 };

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uCell, Math.round(cellSize * dpr));
    };

    const draw = (seconds: number) => {
      eased.x += (target.x - eased.x) * 0.06;
      eased.y += (target.y - eased.y) * 0.06;
      gl.uniform2f(uPointer, eased.x, eased.y);
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    let raf = 0;
    let visible = true;
    const start = performance.now();
    const still = () => (reduced ? 12 : (performance.now() - start) / 1000);
    const loop = (now: number) => {
      draw((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      if (reduced || raf || !visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = 1 - (event.clientY - rect.top) / rect.height;
    };
    const onLeave = () => {
      target.x = 0.5;
      target.y = 0.5;
    };
    const onVisibility = () => (document.hidden ? pause() : play());

    // Resizing clears the canvas, so repaint a still frame whenever the loop isn't running (reduced motion, a hidden
    // tab, off-screen); the loop repaints on its own otherwise.
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!raf) draw(still());
    });
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else pause();
    });
    intersection.observe(canvas);

    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    draw(still());
    play();

    return () => {
      pause();
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [mood, cellSize]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
