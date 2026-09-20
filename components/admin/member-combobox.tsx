"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { searchMembers } from "@/app/admin/(dashboard)/members/actions";

export type MemberOption = { id: string; fullName: string; displayName: string };

export function MemberCombobox({
  name,
  placeholder = "Select a member…",
  defaultValue,
}: {
  /** Hidden input name carrying the selected member id in the form submit. */
  name: string;
  placeholder?: string;
  defaultValue?: MemberOption | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<MemberOption[]>(
    defaultValue ? [defaultValue] : [],
  );
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<MemberOption | null>(defaultValue ?? null);

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

  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" className="w-full justify-between font-normal">
              <span className="truncate">{selected ? selected.displayName : placeholder}</span>
              <ChevronsUpDown className="size-4 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search members…"
              value={query}
              onValueChange={setQuery}
            />
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
                      <CommandItem
                        key={option.id}
                        value={option.id}
                        onSelect={() => {
                          setSelected(option);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4",
                            selected?.id === option.id ? "opacity-100" : "opacity-0",
                          )}
                        />
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
      {selected ? (
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelected(null)}>
          <X />
        </Button>
      ) : null}
    </div>
  );
}
