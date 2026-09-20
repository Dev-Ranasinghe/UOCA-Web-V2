import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TeamGrid, type TeamMember } from "@/components/TeamGrid";
import { prisma } from "@/lib/prisma";

const PLACEHOLDER_IMAGE = "/images/elephant.png";

export default async function TeamPage() {
  const members = await prisma.member.findMany({
    where: { isTeamMember: true, isActive: true },
    include: { profileImage: true },
    orderBy: [{ teamCategory: "asc" }, { teamSortOrder: "asc" }],
  });

  const teamMembers: TeamMember[] = members.map((m) => ({
    id: m.id,
    name: m.fullName,
    role: m.clubRole ?? "",
    category: m.teamCategory ?? "",
    image: m.profileImage?.url ?? PLACEHOLDER_IMAGE,
    socialLinks: m.socialLinks as TeamMember["socialLinks"],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="TEAM" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center w-full max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212] mb-3">
            Our Team
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#555]">
            Meet the Leos driving service, leadership, and fellowship at UOCA.
          </p>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-center font-sans text-sm text-[#555]">
            No team members published yet.
          </p>
        ) : (
          <TeamGrid members={teamMembers} />
        )}

        <div className="border-t border-b border-[#121212] py-8 text-center">
          <p className="font-serif text-lg sm:text-xl text-[#121212]">
            Want to make an impact in your community? Join Leo Club UOCA —{" "}
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
