"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { MemberOption } from "@/components/admin/member-combobox";
import { searchMembers } from "@/app/admin/(dashboard)/members/actions";

export type AuthorEntry = { memberId: string; displayName: string };

export function AuthorManager({
  name,
  initialAuthors,
}: {
  /** Hidden input name carrying a JSON array of memberIds, in order, on submit. */
  name: string;
  initialAuthors: AuthorEntry[];
}) {
  const [authors, setAuthors] = React.useState(initialAuthors);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<MemberOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchMembers(query, true);
        if (!cancelled) setOptions(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  const addAuthor = (member: MemberOption) => {
    if (authors.some((a) => a.memberId === member.id)) return;
    setAuthors((prev) => [...prev, { memberId: member.id, displayName: member.displayName }]);
    setOpen(false);
  };

  const removeAuthor = (memberId: string) => {
    setAuthors((prev) => prev.filter((a) => a.memberId !== memberId));
  };

  const move = (index: number, direction: -1 | 1) => {
    setAuthors((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(authors.map((a) => a.memberId))}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-4" /> Add author
            </Button>
          }
        />
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search authors…" value={query} onValueChange={setQuery} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No authors found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem key={option.id} value={option.id} onSelect={() => addAuthor(option)}>
                        <Search className="size-3.5 opacity-50" />
                        {option.displayName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {authors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No authors added yet. Only members flagged as authors appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {authors.map((a, index) => (
            <li key={a.memberId} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="flex-1 truncate text-sm">{a.displayName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === authors.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeAuthor(a.memberId)}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
