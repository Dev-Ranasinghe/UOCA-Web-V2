/**
 * How a member's position is shown on the UOCA ID pages. Directors are listed by
 * portfolio in the database (e.g. "Sports & Wellbeing"), but the ID just calls
 * them "Director". Everyone else keeps their own title.
 */
export function memberTitle(clubRole: string | null, teamCategory: string | null): string | null {
  return teamCategory === "DIRECTOR" ? "Director" : clubRole;
}
