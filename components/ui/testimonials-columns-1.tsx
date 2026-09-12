"use client";
import React from "react";
import { motion } from "motion/react";

export type Testimonial = {
  text: string;
  name: string;
  role: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role }, i) => (
                <div
                  className="border border-[#121212] bg-[#eae7e1] rounded-none p-6 sm:p-8 flex flex-col justify-between min-h-[260px] max-w-xs w-full"
                  key={i}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-4 font-mono text-[11px] text-[#121212]">
                      <span className="tracking-[2px] font-semibold">ooo</span>
                      <div className="flex-1 border-b border-dashed border-[#121212]"></div>
                      <span className="font-normal text-[#222]">
                        [TESTIMONIAL]
                      </span>
                    </div>
                    <p className="font-sans text-sm sm:text-[15px] text-[#333] leading-relaxed">
                      &ldquo;{text}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <div className="h-10 w-10 shrink-0 rounded-full border border-[#121212] bg-[#dfdcd5] flex items-center justify-center font-mono text-xs font-bold text-[#121212]">
                      {getInitials(name)}
                    </div>
                    <div>
                      <div className="font-serif text-base sm:text-lg font-semibold tracking-tight text-[#121212]">
                        {name}
                      </div>
                      <div className="font-sans text-xs text-[#666]">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
