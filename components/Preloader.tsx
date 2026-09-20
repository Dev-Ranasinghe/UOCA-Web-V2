"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

const WORDS = [
  "Hello",
  "नमस्ते", // Hindi
  "Bonjour", // French
  "こんにちは", // Japanese
  "Guten tag", // German
  "你好", // Chinese
  "Olá", // Portuguese
  "Hallå", // Swedish
  "안녕하세요", // Korean
  "Ciao", // Italian
  "Hallo", // Dutch
  "ආයුබෝවන්", // Sinhala
];
const BG = "#eae7e1";

export default function Preloader() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const preloaderRef = useRef<HTMLDivElement>(null);
  const wordElRef = useRef<HTMLParagraphElement>(null);
  const wordTextRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // The admin dashboard skips the branded language-cycling intro entirely —
    // it needs to load instantly for someone trying to get work done.
    if (isAdmin) return;

    const preloader = preloaderRef.current;
    const wordEl = wordElRef.current;
    const wordText = wordTextRef.current;
    const path = pathRef.current;
    if (!preloader || !wordEl || !wordText || !path) return;

    document.body.style.overflow = "hidden";

    const dimension = { width: window.innerWidth, height: window.innerHeight };

    function getPaths() {
      const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height} L0 0`;
      const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height} L0 0`;
      return { initialPath, targetPath };
    }

    function setInitialPath() {
      const { initialPath } = getPaths();
      path!.setAttribute("d", initialPath);
    }

    setInitialPath();

    let index = 0;
    wordText.textContent = WORDS[index];

    gsap.to(wordEl, {
      opacity: 0.75,
      duration: 1,
      delay: 0.2,
    });

    function cycleWords() {
      if (index === WORDS.length - 1) return;

      const delay = index === 0 ? 0.6 : 0.4;

      gsap.delayedCall(delay, () => {
        index += 1;
        wordText!.textContent = WORDS[index];
        cycleWords();
      });
    }

    cycleWords();

    const totalDelay = 5.5;

    const finish = gsap.delayedCall(totalDelay, () => {
      const { initialPath, targetPath } = getPaths();

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          document.body.style.overflow = "";
          setDone(true);
        },
      });

      tl.to(wordEl, { opacity: 0, duration: 0.3 }, 0);

      tl.to(
        preloader,
        { y: "-100vh", duration: 0.8, delay: 0.2, ease: "power4.inOut" },
        0,
      );

      tl.fromTo(
        path,
        { attr: { d: initialPath } },
        { attr: { d: targetPath }, duration: 0.7, delay: 0.3, ease: "power4.inOut" },
        0,
      );
    });

    const handleResize = () => {
      dimension.width = window.innerWidth;
      dimension.height = window.innerHeight;
      setInitialPath();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      finish.kill();
      document.body.style.overflow = "";
    };
  }, [isAdmin]);

  if (done || isAdmin) return null;

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
      style={{ background: BG }}
    >
      <p
        ref={wordElRef}
        className="absolute z-[2] flex items-center opacity-0 text-[#121212]"
        style={{ fontSize: 42, lineHeight: 1 }}
      >
        <span ref={wordTextRef} />
      </p>

      <svg
        className="absolute top-0 w-full"
        style={{ height: "calc(100% + 300px)" }}
        preserveAspectRatio="none"
      >
        <path ref={pathRef} fill={BG} />
      </svg>
    </div>
  );
}
