"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { searchLeoIdMembers, type LeoIdMemberOption } from "@/app/leo-id/actions";
import { memberTitle } from "@/lib/leo-id/role";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function LeoIdSearch({
  initialMembers,
  activeId,
}: {
  initialMembers: LeoIdMemberOption[];
  activeId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeoIdMemberOption[]>(initialMembers);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (query.trim() === "") {
        setResults(initialMembers);
        return;
      }
      setLoading(true);
      try {
        const found = await searchLeoIdMembers(query);
        if (!cancelled) setResults(found);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, initialMembers]);

  return (
    <div className="border border-[#121212] bg-[#f7f5f0] p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 font-mono text-[11px] sm:text-xs text-[#121212]">
        <span className="tracking-[2px] font-semibold">ooo</span>
        <div className="flex-1 border-b border-dashed border-[#121212]" />
        <span className="tracking-[2px] font-semibold">[FIND A LEO]</span>
      </div>

      <label htmlFor="leo-id-search" className="sr-only">
        Search members
      </label>
      <input
        id="leo-id-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or role…"
        autoComplete="off"
        className="w-full border border-[#121212] bg-white px-3 py-2.5 font-sans text-sm text-[#121212] placeholder:text-[#888] outline-none focus:ring-2 focus:ring-[#121212]/30"
      />

      <ul
        className="mt-4 max-h-[26rem] overflow-y-auto divide-y divide-[#121212]/15 border-t border-[#121212]/15"
        aria-busy={loading}
      >
        {results.length === 0 && !loading ? (
          <li className="py-6 text-center font-sans text-sm text-[#555]">No members found.</li>
        ) : null}
        {results.map((m) => {
          const active = m.id === activeId;
          return (
            <li key={m.id}>
              <Link
                href={`/leo-id?member=${m.id}`}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-3 px-2 py-2.5 transition-colors ${
                  active ? "bg-[#121212] text-white" : "hover:bg-[#e0ddd5]"
                }`}
              >
                <span className="relative size-10 shrink-0 overflow-hidden border border-[#121212] bg-[#e0ddd5]">
                  {m.profileImageUrl ? (
                    <Image src={m.profileImageUrl} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center font-mono text-xs font-bold text-[#121212]">
                      {initials(m.fullName)}
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-base font-bold leading-tight">
                    {m.fullName}
                  </span>
                  {memberTitle(m.clubRole, m.teamCategory) ? (
                    <span
                      className={`block truncate font-sans text-xs ${active ? "text-white/70" : "text-[#555]"}`}
                    >
                      {memberTitle(m.clubRole, m.teamCategory)}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
