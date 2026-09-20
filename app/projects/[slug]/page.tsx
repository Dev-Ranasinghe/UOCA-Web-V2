import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { estimateReadTime } from "@/lib/render-content";

const PLACEHOLDER_IMAGE = "/images/elephant.png";

function formatMonth(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      coverImage: true,
      chairperson: true,
      secretary: true,
      treasurer: true,
      tags: { include: { tag: true } },
      articles: {
        where: { status: "PUBLISHED" },
        include: { featuredImage: true, authors: { include: { member: true }, orderBy: { sortOrder: "asc" } } },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!project || project.status !== "PUBLISHED") notFound();

  const leadership = [
    project.chairperson ? { label: "Chairperson", name: project.chairperson.displayName } : null,
    project.secretary ? { label: "Secretary", name: project.secretary.displayName } : null,
    project.treasurer ? { label: "Treasurer", name: project.treasurer.displayName } : null,
  ].filter(Boolean) as { label: string; name: string }[];

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="PROJECTS" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header">
        <div className="flex items-center gap-1.5 text-sm font-sans text-[#555] mb-6">
          <Link href="/" className="hover:text-[#121212]">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/projects" className="hover:text-[#121212]">
            All projects
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            {(project.startDate || project.endDate) && (
              <p className="font-mono text-xs text-[#555] uppercase tracking-wide mb-3">
                {formatMonth(project.startDate)}
                {project.endDate && project.endDate.getTime() !== project.startDate?.getTime()
                  ? ` — ${formatMonth(project.endDate)}`
                  : ""}
              </p>
            )}

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#121212] leading-[1.1] mb-4">
              {project.name}
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#555] mb-6">{project.shortDescription}</p>

            {leadership.length > 0 ? (
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                {leadership.map((l) => (
                  <div key={l.label}>
                    <span className="font-mono text-[11px] text-[#555] uppercase tracking-wide">{l.label}: </span>
                    <span className="font-serif text-sm text-[#121212]">{l.name}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {project.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="font-mono text-[11px] uppercase tracking-wide bg-[#dfdcd5] text-[#121212] px-2 py-1 rounded-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative aspect-[3/2] w-full border border-[#121212] bg-white overflow-hidden rounded-sm">
            <Image
              src={project.coverImage?.url ?? PLACEHOLDER_IMAGE}
              alt={project.name}
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
        </div>

        {project.articles.length === 0 ? (
          <p className="text-center font-sans text-sm text-[#555]">No articles for this project yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {project.articles.map((article, index) => (
              <PostCard
                key={article.id}
                id={article.slug}
                number={String(index + 1).padStart(3, "0")}
                category={project.name}
                author={article.authors[0]?.member.displayName ?? "Leo Club UOCA"}
                readTime={estimateReadTime(article.content)}
                title={article.title}
                imageUrl={article.featuredImage?.url}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
