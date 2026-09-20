import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthorsGrid, type AuthorMember } from "@/components/AuthorsGrid";
import { prisma } from "@/lib/prisma";

const PLACEHOLDER_IMAGE = "/images/elephant.png";

export default async function AuthorsPage() {
  const members = await prisma.member.findMany({
    where: { isAuthor: true, isActive: true },
    include: { profileImage: true },
    orderBy: { fullName: "asc" },
  });

  const authors: AuthorMember[] = members.map((m) => ({
    id: m.id,
    name: m.fullName,
    bio: m.bio ?? "",
    image: m.profileImage?.url ?? PLACEHOLDER_IMAGE,
    socialLinks: m.socialLinks as AuthorMember["socialLinks"],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="AUTHORS" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center w-full max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212] mb-3">
            Authors
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#555]">
            Dive into the minds behind the stories and conversations you love.
          </p>
        </div>

        {authors.length === 0 ? (
          <p className="text-center font-sans text-sm text-[#555]">No authors published yet.</p>
        ) : (
          <AuthorsGrid authors={authors} />
        )}

        <div className="border-t border-b border-[#121212] py-8 text-center">
          <p className="font-serif text-lg sm:text-xl text-[#121212]">
            Love creating content? Join the Leo Club UOCA team —{" "}
            <a href="/join" className="font-bold underline hover:opacity-80">
              apply now
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
