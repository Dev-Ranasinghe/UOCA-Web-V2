import Image from "next/image";
import Link from "next/link";
import { FaLinkedinIn, FaInstagram, FaWhatsapp } from "react-icons/fa6";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LeoIdSearch } from "@/components/leo-id/LeoIdSearch";
import { LeoIdCard } from "@/components/leo-id/LeoIdCard";
import { memberTitle } from "@/lib/leo-id/role";
import { getLeoIdProfile, searchLeoIdMembers, type LeoIdProfile } from "./actions";

export const metadata = {
  title: "UOCA ID — Leo Club of Universities of Ceylon Alumni",
  description: "Look up a UOCA Leo and get their official UOCA ID card.",
};

const PLACEHOLDER_IMAGE = "/images/elephant.png";

function formatBirthday(iso: string | null) {
  if (!iso) return null;
  // Day and month only — the year isn't shown publicly.
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-dashed border-[#121212]/30 last:border-b-0">
      <dt className="font-mono text-[11px] uppercase tracking-[2px] text-[#555]">{label}</dt>
      <dd className="font-sans text-sm text-[#121212] text-right">{value}</dd>
    </div>
  );
}

function ProfileDetails({ profile }: { profile: LeoIdProfile }) {
  const leoStatus = profile.isNewLeo ? "New Leo" : (profile.leoExperience ?? "Experienced Leo");
  const links = profile.socialLinks;

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,14rem)_1fr]">
      <div className="relative aspect-square w-full max-w-[14rem] border border-[#121212] bg-[#e0ddd5] overflow-hidden mx-auto md:mx-0">
        <Image
          src={profile.profileImageUrl ?? PLACEHOLDER_IMAGE}
          alt={profile.fullName}
          fill
          sizes="224px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-[#121212]">
          {profile.fullName}
        </h2>
        {profile.clubRole || profile.leoDesignation ? (
          <p className="mt-1 font-sans text-sm text-[#555]">
            {[profile.clubRole, profile.leoDesignation].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {profile.bio ? (
          <p className="mt-4 font-sans text-sm leading-relaxed text-[#333]">{profile.bio}</p>
        ) : null}

        <dl className="mt-4">
          <DetailRow label="MyLCI ID" value={profile.mylciId} />
          <DetailRow label="Leo status" value={leoStatus} />
          <DetailRow label="City" value={profile.city} />
          <DetailRow label="Birthday" value={formatBirthday(profile.birthDate)} />
          <DetailRow label="Team" value={profile.teamCategory} />
        </dl>

        {links && (links.linkedin || links.instagram || links.whatsapp) ? (
          <div className="mt-4 flex items-center gap-4 text-[#121212]">
            {links.linkedin ? (
              <a href={links.linkedin} aria-label="LinkedIn" className="hover:opacity-70">
                <FaLinkedinIn className="size-5" />
              </a>
            ) : null}
            {links.instagram ? (
              <a href={links.instagram} aria-label="Instagram" className="hover:opacity-70">
                <FaInstagram className="size-5" />
              </a>
            ) : null}
            {links.whatsapp ? (
              <a href={links.whatsapp} aria-label="WhatsApp" className="hover:opacity-70">
                <FaWhatsapp className="size-5" />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {profile.projects.length > 0 ? (
        <section className="md:col-span-2 border-t border-[#121212] pt-6">
          <div className="flex items-center gap-2 mb-4 font-mono text-[11px] sm:text-xs text-[#121212]">
            <span className="tracking-[2px] font-semibold">ooo</span>
            <div className="flex-1 border-b border-dashed border-[#121212]" />
            <span className="tracking-[2px] font-semibold">[PROJECTS LED]</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {profile.projects.map((p) => (
              <li key={`${p.id}-${p.role}`}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="block h-full border border-[#121212] bg-[#f7f5f0] p-4 transition-shadow hover:shadow-sm"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[2px] text-[#555]">{p.role}</span>
                  <span className="mt-1 block font-serif text-lg font-bold leading-snug text-[#121212]">
                    {p.name}
                  </span>
                  <span className="mt-1 line-clamp-2 block font-sans text-xs text-[#555]">
                    {p.shortDescription}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default async function LeoIdPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string | string[] }>;
}) {
  const { member } = await searchParams;
  const memberId = Array.isArray(member) ? member[0] : member;

  const [initialMembers, profile] = await Promise.all([
    searchLeoIdMembers(""),
    memberId ? getLeoIdProfile(memberId) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="UOCA ID" />

      <main className="section-stack page-container flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center w-full max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212]">UOCA ID</h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[15rem_1fr] lg:grid-cols-[22rem_1fr] items-start">
          <LeoIdSearch initialMembers={initialMembers} activeId={profile?.id ?? null} />

          <section aria-live="polite">
            {profile ? (
              <>
                <LeoIdCard
                  key={profile.id}
                  memberId={profile.id}
                  fullName={profile.fullName}
                  role={memberTitle(profile.clubRole, profile.teamCategory) ?? profile.leoDesignation}
                  mylciId={profile.mylciId}
                  photoUrl={profile.profileImageUrl ?? PLACEHOLDER_IMAGE}
                />
                <ProfileDetails profile={profile} />
              </>
            ) : (
              <div className="stamp-container rounded-sm p-10 sm:p-16 text-center">
                <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[2px] text-[#555] mb-4">
                  {memberId ? "Member not found" : "No Leo selected"}
                </p>
                <p className="font-serif text-xl sm:text-2xl text-[#121212]">
                  {memberId
                    ? "We couldn't find that member. Pick someone from the list."
                    : "Choose a member from the list to see their UOCA ID."}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
