import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaWhatsapp } from "react-icons/fa6";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShareButtons } from "@/components/ShareButtons";
import { prisma } from "@/lib/prisma";
import { renderContentHtml, estimateReadTime } from "@/lib/render-content";

const PLACEHOLDER_IMAGE = "/images/elephant.png";

const CONTENT_CLASS =
  "font-sans text-base sm:text-lg text-[#222] leading-relaxed space-y-5 " +
  "[&_h2]:font-serif [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-[#121212] [&_h2]:mt-10 [&_h2]:mb-1 " +
  "[&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#121212] [&_h3]:mt-8 [&_h3]:mb-1 " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-[#121212] [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:italic " +
  "[&_a]:underline [&_a]:decoration-2";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      featuredImage: true,
      authors: { include: { member: { include: { profileImage: true } } }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!article || article.status !== "PUBLISHED") notFound();

  const publishedAt = article.publishedAt ?? article.createdAt;

  const [otherArticles, previousArticle, nextArticle] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", slug: { not: slug } },
      include: { featuredImage: true, authors: { include: { member: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.article.findFirst({
      where: { projectId: null, status: "PUBLISHED", publishedAt: { lt: publishedAt } },
      include: { featuredImage: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.article.findFirst({
      where: { projectId: null, status: "PUBLISHED", publishedAt: { gt: publishedAt } },
      include: { featuredImage: true },
      orderBy: { publishedAt: "asc" },
    }),
  ]);

  const featuredPost = otherArticles[0];
  const recentPosts = otherArticles.slice(1, 3);

  const html = await renderContentHtml(article.content);
  const authorNames = article.authors.map((a) => a.member.displayName).join(", ") || "Leo Club UOCA";
  const primaryAuthor = article.authors[0]?.member;
  const readTime = estimateReadTime(article.content).toLowerCase();
  const articlePath = `/blog/${article.slug}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="BLOG" />

      <main className="section-stack page-container max-w-6xl flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header w-full max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1.5 text-sm font-sans text-[#555] mb-6">
            <Link href="/" className="hover:text-[#121212]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/blog" className="hover:text-[#121212]">
              All blogs
            </Link>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#121212] leading-[1.15] mb-6">
            {article.title}
          </h1>

          {article.subtitle || article.excerpt ? (
            <p className="font-sans text-base sm:text-lg text-[#555] mb-6">
              {article.subtitle ?? article.excerpt}
            </p>
          ) : null}

          <p className="font-sans text-sm text-[#555]">
            by <span className="font-semibold text-[#121212]">{authorNames}</span>{" "}
            <span className="mx-1.5 text-[#999]">|</span> {readTime}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
          {/* Main content column */}
          <div>
            <div className="relative aspect-[16/9] w-full border border-[#121212] bg-white overflow-hidden mb-10 rounded-sm">
              <Image
                src={article.featuredImage?.url ?? PLACEHOLDER_IMAGE}
                alt={article.title}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover object-center"
                priority
              />
            </div>

            <div className={CONTENT_CLASS} dangerouslySetInnerHTML={{ __html: html }} />

            {(previousArticle || nextArticle) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-16 pt-8 border-t border-[#121212]">
                {previousArticle ? (
                  <Link
                    href={`/blog/${previousArticle.slug}`}
                    className="group flex items-center gap-3 border border-[#121212] bg-[#f7f5f0] p-2.5 hover:shadow-sm transition-shadow"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 border border-[#121212] overflow-hidden">
                      <Image
                        src={previousArticle.featuredImage?.url ?? PLACEHOLDER_IMAGE}
                        alt={previousArticle.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wide text-[#555] mb-0.5">
                        Previous blog
                      </p>
                      <p className="font-serif text-sm text-[#121212] leading-snug line-clamp-1 group-hover:underline">
                        {previousArticle.title}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div />
                )}
                {nextArticle ? (
                  <Link
                    href={`/blog/${nextArticle.slug}`}
                    className="group flex items-center justify-end gap-3 border border-[#121212] bg-[#f7f5f0] p-2.5 hover:shadow-sm transition-shadow text-right"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase tracking-wide text-[#555] mb-0.5">Next blog</p>
                      <p className="font-serif text-sm text-[#121212] leading-snug line-clamp-1 group-hover:underline">
                        {nextArticle.title}
                      </p>
                    </div>
                    <div className="relative w-14 h-14 flex-shrink-0 border border-[#121212] overflow-hidden">
                      <Image
                        src={nextArticle.featuredImage?.url ?? PLACEHOLDER_IMAGE}
                        alt={nextArticle.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#121212] mb-3">Share post</h2>
              <ShareButtons path={articlePath} title={article.title} />
            </div>

            <hr className="border-[#121212]" />

            {primaryAuthor ? (
              <>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#121212] mb-3">Author info</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 flex-shrink-0 border border-[#121212] overflow-hidden">
                      <Image
                        src={primaryAuthor.profileImage?.url ?? PLACEHOLDER_IMAGE}
                        alt={primaryAuthor.displayName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-serif text-base text-[#121212]">{primaryAuthor.displayName}</p>
                      {primaryAuthor.clubRole ? (
                        <p className="font-sans text-xs text-[#555]">{primaryAuthor.clubRole}</p>
                      ) : null}
                      {(() => {
                        const social = primaryAuthor.socialLinks as
                          | { linkedin?: string; instagram?: string; whatsapp?: string }
                          | null;
                        if (!social) return null;
                        return (
                          <div className="flex items-center gap-2.5 mt-1.5 text-[#121212]">
                            {social.linkedin ? (
                              <a href={social.linkedin} aria-label="LinkedIn" className="hover:opacity-70">
                                <FaLinkedinIn className="w-3.5 h-3.5" />
                              </a>
                            ) : null}
                            {social.instagram ? (
                              <a href={social.instagram} aria-label="Instagram" className="hover:opacity-70">
                                <FaInstagram className="w-3.5 h-3.5" />
                              </a>
                            ) : null}
                            {social.whatsapp ? (
                              <a href={social.whatsapp} aria-label="WhatsApp" className="hover:opacity-70">
                                <FaWhatsapp className="w-3.5 h-3.5" />
                              </a>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <hr className="border-[#121212]" />
              </>
            ) : null}

            {featuredPost ? (
              <>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#121212] mb-3">Featured post</h2>
                  <Link href={`/blog/${featuredPost.slug}`} className="group flex items-center gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 border border-[#121212] overflow-hidden">
                      <Image
                        src={featuredPost.featuredImage?.url ?? PLACEHOLDER_IMAGE}
                        alt={featuredPost.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-sm text-[#121212] leading-snug group-hover:underline">
                        {featuredPost.title}
                      </p>
                      <p className="font-sans text-xs text-[#555] mt-1">
                        by {featuredPost.authors[0]?.member.displayName ?? "Leo Club UOCA"}{" "}
                        <span className="mx-1 text-[#999]">|</span> {estimateReadTime(featuredPost.content).toLowerCase()}
                      </p>
                    </div>
                  </Link>
                </div>

                <hr className="border-[#121212]" />
              </>
            ) : null}

            {recentPosts.length > 0 ? (
              <div>
                <h2 className="font-serif text-xl font-bold text-[#121212] mb-3">Recent posts</h2>
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="pb-4 border-b border-[#121212] last:border-b-0 last:pb-0">
                      <Link href={`/blog/${post.slug}`} className="group">
                        <p className="font-serif text-base text-[#121212] leading-snug group-hover:underline">
                          {post.title}
                        </p>
                      </Link>
                      <p className="font-sans text-xs text-[#555] mt-1">
                        by {post.authors[0]?.member.displayName ?? "Leo Club UOCA"}{" "}
                        <span className="mx-1 text-[#999]">|</span> {estimateReadTime(post.content).toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
