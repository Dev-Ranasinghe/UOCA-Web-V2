import Image from "next/image";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionDivider from "@/components/SectionDivider";
import ContactForm from "@/components/ContactForm";
import { prisma } from "@/lib/prisma";

// These pages read the database but were prerendered once at build time, so a project or member added in the admin never
// showed up until the next deploy. Statically served, refreshed in the background at most once a minute.
export const revalidate = 60;

export default async function ContactPage() {
  // The EXCO team, in the order set in the admin dashboard. Each name links to that member's UOCA ID page.
  const excoMembers = await prisma.member.findMany({
    where: { isTeamMember: true, isActive: true, teamCategory: "EXCO" },
    orderBy: { teamSortOrder: "asc" },
    select: { id: true, fullName: true },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="CONTACT" />

      <main className="page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-11 md:gap-14 lg:gap-20">
          {/* Left Column — About Us */}
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#121212] mb-4 md:mb-6">
              About Us
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-3 md:mb-5">
              Welcome to the Leo Club of Universities of Ceylon Alumni, a
              community-based club under the Lions Club of Galkissa, Leo
              District 306 D1, and Leo Multiple District 306 Sri Lanka &amp;
              Maldives. We are a community of passionate individuals
              committed to creating meaningful change through service,
              leadership, and collaboration.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-0 md:mb-8">
              For the Leoistic Year 2026/27, under the leadership of Leo Sasun
              Wijeratne, we are driven by our vision, &ldquo;Passion Meets
              Purpose,&rdquo; bringing together dedicated members to serve
              communities, inspire positive action, and create a lasting
              impact.
            </p>

            <SectionDivider className="my-5 md:mt-0 md:mb-10" />

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mb-4">
              Join the Movement
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-3 md:mb-4">
              Looking to make a difference, connect with like-minded
              individuals, and create meaningful change in your community? We
              invite you to join the UOC Alumni community and become part of
              the Leo movement.
            </p>
            <p className="font-sans text-sm sm:text-base text-[#333] leading-relaxed mb-4 md:mb-6">
              Together, we can turn passion into purpose through service,
              leadership, friendship, and impactful initiatives. Whether
              you&apos;re looking to volunteer, collaborate, or simply be part
              of something meaningful, there&apos;s a place for you with us.
            </p>

            <div className="mb-0 md:mb-10">
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 bg-[#121212] text-white px-4 py-2 rounded-full hover:bg-[#333] transition-colors text-xs font-mono font-bold tracking-wider"
              >
                JOIN UOCA <UserPlus className="w-3.5 h-3.5" />
              </Link>
            </div>

            {excoMembers.length > 0 ? (
              <>
                <SectionDivider className="my-5 md:hidden" />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mb-4">
                  EXCO Team
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-3 md:gap-y-3">
                  {excoMembers.map((member) => (
                    <Link
                      key={member.id}
                      href={`/leo-id?member=${member.id}`}
                      className="font-mono text-xs font-bold tracking-wide uppercase text-[#121212] underline-offset-4 decoration-dashed hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {member.fullName}
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Right Column — Contact form */}
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#121212] mb-4 md:mb-8">
              Contact us
            </h1>

            <ContactForm />

            <SectionDivider className="my-5 md:mt-0 md:mb-10" />

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#121212] mb-4 md:mb-5">
              Web Designer
            </h2>
            <div className="flex flex-row gap-4 md:gap-5 mb-0">
              <div className="relative w-[104px] aspect-[5/4] self-start md:self-auto md:w-40 md:aspect-square border border-[#121212] bg-[#e0ddd5] overflow-hidden flex-shrink-0">
                <Image
                  src="/images/founder.jpg"
                  alt="Dandy Studios"
                  fill
                  sizes="(min-width: 768px) 160px, 104px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-bold text-[#121212] mb-1">
                  Dandy Studios
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <a
                    href="#"
                    className="w-6 h-6 border border-[#121212] rounded flex items-center justify-center text-[10px] font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors"
                  >
                    in
                  </a>
                  <a
                    href="#"
                    className="w-6 h-6 border border-[#121212] rounded flex items-center justify-center text-[10px] font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors"
                  >
                    f
                  </a>
                  <a
                    href="#"
                    className="w-6 h-6 border border-[#121212] rounded flex items-center justify-center text-[10px] font-mono font-bold hover:bg-[#121212] hover:text-white transition-colors"
                  >
                    X
                  </a>
                </div>
                <p className="font-sans text-sm text-[#333] leading-relaxed">
                  I&apos;m the founder of Dandy Studios, a creative agency
                  managing the IT systems of UOC Alumni while crafting digital
                  experiences, creative solutions, and innovative designs that
                  bring ideas to life.
                </p>
              </div>
            </div>

            <SectionDivider className="mt-5 md:mt-8" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
