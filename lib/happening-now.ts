import { prisma } from "@/lib/prisma";
import { todayInColombo } from "@/lib/lynx/data";

export interface HappeningItem {
  key: string;
  number: string;
  title: string;
  href: string;
  imageUrl: string;
  /** Dates and chairperson, or a stand-in line for placeholders. */
  meta: string;
}

// Shown only to fill the six slots while fewer than six published projects are running. Swap for real ones by publishing a
// project whose start/end months include this month; each real project takes the first placeholder's place.
const PLACEHOLDERS = ["Blood Drive", "Beach Cleanup", "Tech For Good", "Fellowship Night", "Outreach Camp", "Global Partners"];
const PLACEHOLDER_IMAGE = "/images/elephant-card.webp";

/** Project dates are month-level on this site (see how the project pages show them), so "now" means this month. */
const monthIndex = (year: number, month0: number) => year * 12 + month0;
const monthYear = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** Up to `limit` projects whose months include the current month in Sri Lanka, newest start first, padded with placeholders. */
export async function getHappeningNow(limit = 6): Promise<HappeningItem[]> {
  const [year, month] = todayInColombo().split("-").map(Number);
  const now = monthIndex(year, month - 1);

  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED", startDate: { not: null, lte: new Date(Date.UTC(year, month, 1)) } },
    include: { coverImage: true, chairperson: true },
    orderBy: { startDate: "desc" },
  });

  const running = projects.filter((p) => {
    const start = p.startDate!;
    const end = p.endDate ?? start; // a project with no end date counts for its start month only
    return monthIndex(start.getUTCFullYear(), start.getUTCMonth()) <= now && monthIndex(end.getUTCFullYear(), end.getUTCMonth()) >= now;
  });

  const items: HappeningItem[] = running.slice(0, limit).map((p) => {
    const start = monthYear(p.startDate!);
    const end = p.endDate ? monthYear(p.endDate) : start;
    return {
      key: p.id,
      number: "",
      title: p.name,
      href: `/projects/${p.slug}`,
      imageUrl: p.coverImage?.url ?? PLACEHOLDER_IMAGE,
      meta: [start === end ? start : `${start} to ${end}`, p.chairperson ? `Chair: ${p.chairperson.displayName}` : ""]
        .filter(Boolean)
        .join(" | "),
    };
  });

  PLACEHOLDERS.slice(0, Math.max(0, limit - items.length)).forEach((title) =>
    items.push({ key: `placeholder-${title}`, number: "", title, href: "/projects", imageUrl: PLACEHOLDER_IMAGE, meta: "Details coming soon" }),
  );

  return items.map((item, i) => ({ ...item, number: String(i + 1).padStart(3, "0") }));
}
