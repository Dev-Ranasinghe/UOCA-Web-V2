import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

const PLACEHOLDER_IMAGE = "/images/elephant.png";

// These pages read the database but were prerendered once at build time, so a project or member added in the admin never
// showed up until the next deploy. Statically served, refreshed in the background at most once a minute.
export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { kind: { in: ["BLOG", "GENERAL"] } },
    include: { image: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="CATEGORIES" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212]">
            Categories
          </h1>
        </div>

        {categories.length === 0 ? (
          <p className="text-center font-sans text-sm text-[#555]">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className="border border-[#121212] bg-[#f7f5f0] p-4 rounded-sm flex flex-col sm:flex-row gap-5 items-center hover:shadow-md transition-shadow group"
              >
                <div className="relative w-full sm:w-48 aspect-[4/3] border border-[#121212] bg-[#e0ddd5] overflow-hidden flex-shrink-0">
                  <Image
                    src={cat.image?.url ?? PLACEHOLDER_IMAGE}
                    alt={cat.name}
                    fill
                    sizes="(min-width: 640px) 192px, 100vw"
                    className="object-cover transition-transform duration-300"
                  />
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#121212] mb-2 group-hover:underline">
                    {cat.name}
                  </h3>
                  {cat.description ? (
                    <p className="font-sans text-xs text-[#555] leading-relaxed">{cat.description}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center font-mono text-xs text-[#777] uppercase tracking-widest">
          THAT&apos;S EVERYTHING FOR NOW!
        </div>
      </main>

      <Footer />
    </div>
  );
}
