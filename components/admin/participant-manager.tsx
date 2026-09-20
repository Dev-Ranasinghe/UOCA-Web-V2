"use client";

import * as React from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

export type ParticipantEntry = { memberId: string; displayName: string };

export function ParticipantManager({
  name,
  initialParticipants,
}: {
  /** Hidden input name carrying a JSON array of member ids on submit. */
  name: string;
  initialParticipants: ParticipantEntry[];
}) {
  const [participants, setParticipants] = React.useState(initialParticipants);
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
        const results = await searchMembers(query);
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

  const addParticipant = (member: MemberOption) => {
    if (participants.some((p) => p.memberId === member.id)) return;
    setParticipants((prev) => [...prev, { memberId: member.id, displayName: member.displayName }]);
    setOpen(false);
  };

  const removeParticipant = (memberId: string) => {
    setParticipants((prev) => prev.filter((p) => p.memberId !== memberId));
  };

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(participants.map((p) => p.memberId))}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-4" /> Add participant
            </Button>
          }
        />
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search members…" value={query} onValueChange={setQuery} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No members found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem key={option.id} value={option.id} onSelect={() => addParticipant(option)}>
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

      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No participants added yet.</p>
      ) : (
        <ul className="space-y-2">
          {participants.map((p) => (
            <li key={p.memberId} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="flex-1 truncate text-sm">{p.displayName}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeParticipant(p.memberId)}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
