import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";

// These pages read the database but were prerendered once at build time, so a project or member added in the admin never
// showed up until the next deploy. Statically served, refreshed in the background at most once a minute.
export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    include: { coverImage: true, chairperson: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="PROJECTS" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212]">Projects</h1>
        </div>

        {projects.length === 0 ? (
          <p className="text-center font-sans text-sm text-[#555]">No projects published yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <PostCard
                key={project.id}
                horizontal
                href={`/projects/${project.slug}`}
                number={String(index + 1).padStart(3, "0")}
                category={
                  project.startDate
                    ? project.startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "Project"
                }
                metaLabel={project.chairperson ? `Chair: ${project.chairperson.displayName}` : ""}
                author=""
                readTime=""
                title={project.name}
                description={project.shortDescription}
                imageUrl={project.coverImage?.url}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
