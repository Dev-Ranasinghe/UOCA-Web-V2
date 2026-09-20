"use client";

import React from "react";
import { motion } from "motion/react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import SectionDivider from "@/components/SectionDivider";

const testimonials: Testimonial[] = [
  {
    text: "The stories feel considered, local, and full of life. Each edition leaves us seeing familiar places with fresh eyes.",
    name: "Nadeesha Perera",
    role: "Community Reader",
  },
  {
    text: "Reado brings a real sense of curiosity to every subject. It has become the place we send friends when a conversation deserves more depth.",
    name: "Malith Fernando",
    role: "Creative Partner",
  },
  {
    text: "From culture to everyday ideas, this is a thoughtful record of the people and passions shaping our community.",
    name: "Sashini Jayawardena",
    role: "Longtime Subscriber",
  },
  {
    text: "Every issue reads like a conversation with a friend who notices things you'd otherwise walk past.",
    name: "Ruwan Jayasuriya",
    role: "Newsletter Subscriber",
  },
  {
    text: "As a contributor, I've never worked with an editorial team that cared this much about getting a story right.",
    name: "Chamodi Rathnayake",
    role: "Guest Contributor",
  },
  {
    text: "The podcast episodes are the highlight of my commute. Thoughtful guests, no filler.",
    name: "Kavindu Perera",
    role: "Podcast Listener",
  },
  {
    text: "I've recommended Reado to every alumnus I know. It's the only publication that still feels handmade.",
    name: "Amaya Fernando",
    role: "Community Volunteer",
  },
  {
    text: "Reado covers the things we actually talk about at reunions, just written far better than we ever could.",
    name: "Tharindu Silva",
    role: "Alumni Member",
  },
  {
    text: "Clean design, honest writing, and a genuine point of view. That combination is rare these days.",
    name: "Dilani Wickramasinghe",
    role: "Design Reader",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export default function Testimonials() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true }}
      >
        <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#121212]">
          From our community
        </h2>
        <p className="font-sans text-sm sm:text-base text-[#444] mt-3">
          What readers and collaborators share about the stories that stay with them.
        </p>
      </motion.div>

      <SectionDivider spaced />

      <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden">
        <TestimonialsColumn testimonials={firstColumn} duration={15} />
        <TestimonialsColumn
          testimonials={secondColumn}
          className="hidden md:block"
          duration={19}
        />
        <TestimonialsColumn
          testimonials={thirdColumn}
          className="hidden lg:block"
          duration={17}
        />
      </div>
    </section>
  );
}
