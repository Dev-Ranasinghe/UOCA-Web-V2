"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue } from "motion/react";

export type PointerProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export function Pointer({ className, style, children }: PointerProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  React.useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setIsVisible(true);
    };
    const handleLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", updatePosition, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, [x, y]);

  // The admin dashboard is a functional tool, not the branded public site —
  // it keeps the native cursor instead of this custom heart pointer.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            left: x,
            top: y,
            translateX: "-50%",
            translateY: "-50%",
            pointerEvents: "none",
            zIndex: 9999,
            ...style,
          }}
          className={className}
        >
          {children ?? (
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#121212"
              animate={{
                scale: [1, 1.18, 1],
                filter: [
                  "drop-shadow(0 0 3px rgba(240, 200, 8, 0.7)) drop-shadow(0 0 6px rgba(240, 200, 8, 0.4))",
                  "drop-shadow(0 0 6px rgba(240, 200, 8, 0.9)) drop-shadow(0 0 10px rgba(240, 200, 8, 0.6))",
                  "drop-shadow(0 0 3px rgba(240, 200, 8, 0.7)) drop-shadow(0 0 6px rgba(240, 200, 8, 0.4))",
                ],
              }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M12 4.248c-3.148-5.402-12-3.825-12 2.944 0 4.661 5.571 9.427 12 15.808 6.43-6.381 12-11.147 12-15.808 0-6.769-8.852-8.346-12-2.944z" />
            </motion.svg>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Pointer;
