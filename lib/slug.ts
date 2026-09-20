export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "item";
}

/** Appends -2, -3, ... until `isTaken` reports the candidate is free. */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}
