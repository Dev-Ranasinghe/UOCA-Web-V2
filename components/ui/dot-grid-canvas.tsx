"use client";

import { useEffect, useRef } from "react";

/**
 * The animated dot-grid reveal: a full-viewport field of square dots that flicker in and out at random, with a
 * ring sweeping outward from the screen's centre so the whole thing "switches on" a moment after mount. Ported
 * 1:1 (same GLSL, same constants) from a Three.js/GLSL3 demo to raw WebGL2 — no Three.js dependency, matching
 * this codebase's other shader components (components/ui/auralis.tsx, gradient-mesh.tsx). GLSL ES 3.00 (not the
 * WebGL1 ES 1.00 the other components use) because the shader indexes u_opacities/u_colors by a value computed
 * at runtime, which WebGL1 doesn't reliably allow in a fragment shader.
 */

const vertexShaderGLSL = `#version 300 es
precision mediump float;
in vec2 a_position;
uniform vec2 u_resolution;
out vec2 fragCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  fragCoord = (a_position + 1.0) * 0.5 * u_resolution;
  fragCoord.y = u_resolution.y - fragCoord.y;
}
`;

const fragmentShaderGLSL = `#version 300 es
precision mediump float;
in vec2 fragCoord;

uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;

out vec4 fragColor;

float PHI = 1.61803398874989484820459;
float random(vec2 xy) {
    return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}

void main() {
    vec2 st = fragCoord.xy;
    st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
    st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

    float opacity = step(0.0, st.x) * step(0.0, st.y);

    vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

    float frequency = 5.0;
    float show_offset = random(st2);
    float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
    opacity *= u_opacities[int(rand * 10.0)];
    opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
    opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

    vec3 color = u_colors[int(show_offset * 6.0)];

    float animation_speed_factor = 3.0;
    vec2 center_grid = u_resolution / 2.0 / u_total_size;
    float dist_from_center = distance(center_grid, st2);

    float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

    float current_timing_offset = timing_offset_intro;
    opacity *= step(current_timing_offset, u_time * animation_speed_factor);
    opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

    fragColor = vec4(color, opacity);
    fragColor.rgb *= fragColor.a;
}
`;

const DEFAULT_OPACITIES = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0];
const DEFAULT_COLORS: [number, number, number][] = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1],
];

export interface DotGridCanvasProps {
  opacities?: number[];
  colors?: [number, number, number][];
  totalSize?: number;
  dotSize?: number;
  className?: string;
}

export function DotGridCanvas({
  opacities = DEFAULT_OPACITIES,
  colors = DEFAULT_COLORS,
  totalSize = 20.0,
  dotSize = 6.0,
  className,
}: DotGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) return;

    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("DotGridCanvas shader failed to compile:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = createShader(gl.VERTEX_SHADER, vertexShaderGLSL);
    const fragment = createShader(gl.FRAGMENT_SHADER, fragmentShaderGLSL);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("DotGridCanvas program failed to link:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      opacities: gl.getUniformLocation(program, "u_opacities"),
      colors: gl.getUniformLocation(program, "u_colors"),
      totalSize: gl.getUniformLocation(program, "u_total_size"),
      dotSize: gl.getUniformLocation(program, "u_dot_size"),
    };

    gl.uniform1fv(locs.opacities, new Float32Array(opacities));
    gl.uniform3fv(locs.colors, new Float32Array(colors.flat()));
    gl.uniform1f(locs.totalSize, totalSize);
    gl.uniform1f(locs.dotSize, dotSize);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    // A few seconds in, the intro sweep has finished and every dot is in its steady-state flicker, so this is a
    // fair "settled" frame to freeze reduced-motion visitors on instead of leaving the intro half-revealed.
    const STILL_FRAME_S = 6;
    const startTime = performance.now();

    const draw = (elapsedS: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, elapsedS);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const loop = () => {
      draw((performance.now() - startTime) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduceMotion || raf) return;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      draw(reduceMotion ? STILL_FRAME_S : (performance.now() - startTime) / 1000);
    };

    window.addEventListener("resize", resize);
    resize();
    start();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [opacities, colors, totalSize, dotSize]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

export default DotGridCanvas;
