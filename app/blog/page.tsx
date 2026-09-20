import Link from "next/link";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { estimateReadTime } from "@/lib/render-content";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const [categories, articles] = await Promise.all([
    prisma.category.findMany({
      where: { kind: { in: ["BLOG", "GENERAL"] } },
      orderBy: { name: "asc" },
    }),
    prisma.article.findMany({
      where: {
        projectId: null,
        status: "PUBLISHED",
        category: category ? { slug: category } : undefined,
      },
      include: {
        category: true,
        authors: { include: { member: true }, orderBy: { sortOrder: "asc" } },
        featuredImage: true,
      },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="BLOG" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header">
        <div className="text-center">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#121212]">
            Blog
          </h1>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mt-8">
          <Link
            href="/blog"
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-sm border border-[#121212] transition-colors ${
              !category ? "bg-[#121212] text-white" : "bg-[#f7f5f0] text-[#121212] hover:bg-[#dfdcd5]"
            }`}
          >
            ALL
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-sm border border-[#121212] transition-colors ${
                category === cat.slug
                  ? "bg-[#121212] text-white"
                  : "bg-[#f7f5f0] text-[#121212] hover:bg-[#dfdcd5]"
              }`}
            >
              {cat.name.toUpperCase()}
            </Link>
          ))}
        </div>
        </div>

        {articles.length === 0 ? (
          <p className="text-center font-sans text-sm text-[#555]">
            No articles published yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <PostCard
                key={article.id}
                id={article.slug}
                number={String(index + 1).padStart(3, "0")}
                category={article.category?.name ?? "General"}
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
