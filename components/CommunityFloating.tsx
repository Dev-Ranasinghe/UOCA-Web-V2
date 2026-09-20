"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import SphereImageGrid, { type ImageData } from "@/components/ui/img-sphere";

// Real UOCA club members, sourced from `LC UOCA Site/Club Members/{BOD,EXCO,HEAD}`.
const CLUB_MEMBERS: { name: string; category: string; image: string }[] = [
  { name: "Akindu", category: "Board of Directors", image: "/images/club-members-web/bod/Akindu.webp" },
  { name: "Induwara", category: "Board of Directors", image: "/images/club-members-web/bod/Induwara.webp" },
  { name: "Manasi", category: "Board of Directors", image: "/images/club-members-web/bod/Manasi.webp" },
  { name: "Pudam", category: "Board of Directors", image: "/images/club-members-web/bod/Pudam.webp" },
  { name: "Rohansi", category: "Board of Directors", image: "/images/club-members-web/bod/Rohansi.webp" },
  { name: "Sahan", category: "Board of Directors", image: "/images/club-members-web/bod/Sahan.webp" },
  { name: "Samadhi", category: "Board of Directors", image: "/images/club-members-web/bod/Samadhi.webp" },
  { name: "Sasmitha", category: "Board of Directors", image: "/images/club-members-web/bod/Sasmitha.webp" },
  { name: "Senadhi", category: "Board of Directors", image: "/images/club-members-web/bod/Senadhi.webp" },
  { name: "Senith", category: "Board of Directors", image: "/images/club-members-web/bod/Senith.webp" },
  { name: "Senuri", category: "Board of Directors", image: "/images/club-members-web/bod/Senuri.webp" },
  { name: "Shevini", category: "Board of Directors", image: "/images/club-members-web/bod/Shevini.webp" },
  { name: "Thathsara", category: "Board of Directors", image: "/images/club-members-web/bod/Thathsara.webp" },
  { name: "Thilini", category: "Board of Directors", image: "/images/club-members-web/bod/Thilini.webp" },
  { name: "Aloka", category: "Exco", image: "/images/club-members-web/exco/Aloka.webp" },
  { name: "Dev", category: "Exco", image: "/images/club-members-web/exco/Dev.webp" },
  { name: "Gagana", category: "Exco", image: "/images/club-members-web/exco/Gagana.webp" },
  { name: "Imasha", category: "Exco", image: "/images/club-members-web/exco/Imasha.webp" },
  { name: "Lithira", category: "Exco", image: "/images/club-members-web/exco/Lithira.webp" },
  { name: "Manujitha", category: "Exco", image: "/images/club-members-web/exco/Manujitha.webp" },
  { name: "Rivindu", category: "Exco", image: "/images/club-members-web/exco/Rivindu.webp" },
  { name: "Sasun", category: "Exco", image: "/images/club-members-web/exco/Sasun.webp" },
  { name: "Shakya", category: "Exco", image: "/images/club-members-web/exco/Shakya.webp" },
  { name: "Thisula", category: "Exco", image: "/images/club-members-web/exco/Thisula.webp" },
  { name: "Deelaka", category: "Head", image: "/images/club-members-web/head/Deelaka.webp" },
  { name: "Dilan", category: "Head", image: "/images/club-members-web/head/Dilan.webp" },
  { name: "Onel", category: "Head", image: "/images/club-members-web/head/Onel.webp" },
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
            Meet the team behind UOCA
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#aaa] leading-relaxed mb-8 max-w-md">
            The people who lead, create, and bring the Leo spirit to life.
            Meet the dedicated Leos behind the Leo Club of UOCA, working
            together to turn passion into purpose.
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
