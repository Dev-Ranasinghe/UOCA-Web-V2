"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import SphereImageGrid, { type ImageData } from "@/components/ui/img-sphere";

// Real UOCA club members, sourced from `LC UOCA Site/Club Members/{BOD,EXCO,HEAD}`.
const CLUB_MEMBERS: { name: string; category: string; image: string }[] = [
  { name: "Akindu", category: "Board of Directors", image: "/images/club-members/bod/Akindu.png" },
  { name: "Induwara", category: "Board of Directors", image: "/images/club-members/bod/Induwara.png" },
  { name: "Manasi", category: "Board of Directors", image: "/images/club-members/bod/Manasi.png" },
  { name: "Pudam", category: "Board of Directors", image: "/images/club-members/bod/Pudam.png" },
  { name: "Rohansi", category: "Board of Directors", image: "/images/club-members/bod/Rohansi.png" },
  { name: "Sahan", category: "Board of Directors", image: "/images/club-members/bod/Sahan.png" },
  { name: "Samadhi", category: "Board of Directors", image: "/images/club-members/bod/Samadhi.png" },
  { name: "Sasmitha", category: "Board of Directors", image: "/images/club-members/bod/Sasmitha.png" },
  { name: "Senadhi", category: "Board of Directors", image: "/images/club-members/bod/Senadhi.png" },
  { name: "Senith", category: "Board of Directors", image: "/images/club-members/bod/Senith.png" },
  { name: "Senuri", category: "Board of Directors", image: "/images/club-members/bod/Senuri.png" },
  { name: "Shevini", category: "Board of Directors", image: "/images/club-members/bod/Shevini.png" },
  { name: "Thathsara", category: "Board of Directors", image: "/images/club-members/bod/Thathsara.png" },
  { name: "Thilini", category: "Board of Directors", image: "/images/club-members/bod/Thilini.png" },
  { name: "Aloka", category: "Exco", image: "/images/club-members/exco/Aloka.png" },
  { name: "Dev", category: "Exco", image: "/images/club-members/exco/Dev.png" },
  { name: "Gagana", category: "Exco", image: "/images/club-members/exco/Gagana.png" },
  { name: "Imasha", category: "Exco", image: "/images/club-members/exco/Imasha.png" },
  { name: "Lithira", category: "Exco", image: "/images/club-members/exco/Lithira.png" },
  { name: "Manujitha", category: "Exco", image: "/images/club-members/exco/Manujitha.png" },
  { name: "Rivindu", category: "Exco", image: "/images/club-members/exco/Rivindu.png" },
  { name: "Sasun", category: "Exco", image: "/images/club-members/exco/Sasun.png" },
  { name: "Shakya", category: "Exco", image: "/images/club-members/exco/Shakya.png" },
  { name: "Thisula", category: "Exco", image: "/images/club-members/exco/Thisula.png" },
  { name: "Deelaka", category: "Head", image: "/images/club-members/head/Deelaka.png" },
  { name: "Dilan", category: "Head", image: "/images/club-members/head/Dilan.png" },
  { name: "Onel", category: "Head", image: "/images/club-members/head/Onel.png" },
];

// Same total circle count as the original SphereImageGrid demo (60), cycling
// through every real club member so everyone appears at least twice.
const TOTAL_CIRCLES = 60;

const images: ImageData[] = Array.from({ length: TOTAL_CIRCLES }, (_, i) => {
  const member = CLUB_MEMBERS[i % CLUB_MEMBERS.length];
  return {
    id: `club-member-${i + 1}`,
    src: member.image,
    alt: member.name,
    title: member.name,
    description: member.category,
  };
});

function useSphereSize() {
  const [size, setSize] = useState(320);

  useEffect(() => {
    const compute = () => setSize(window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 380 : 460);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return size;
}

export default function CommunityFloating() {
  const containerSize = useSphereSize();

  return (
    <section className="section-dark w-full bg-[#050505] text-white px-4 sm:px-6 border-t border-b border-[#222] overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left: 3D sphere of member photos */}
        <div className="flex justify-center order-2 lg:order-1">
          <SphereImageGrid
            images={images}
            containerSize={containerSize}
            sphereRadius={containerSize * 0.42}
            baseImageScale={0.16}
            dragSensitivity={0.6}
            momentumDecay={0.95}
            autoRotate
            autoRotateSpeed={0.25}
          />
        </div>

        {/* Right: heading + copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="order-1 lg:order-2"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#999] mb-4">
            [ OUR PEOPLE ]
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-5">
            Meet the backbone of UOCA
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#aaa] leading-relaxed mb-8 max-w-md">
            Every project, story, and event READO covers is powered by a team of
            volunteers who show up long before the credit does. Drag the sphere
            to meet the Leos behind the scenes.
          </p>
          <Link
            href="/team"
            className="inline-block bg-white text-[#121212] px-5 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider hover:bg-[#eae7e1] transition-colors"
          >
            MEET THE TEAM
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
