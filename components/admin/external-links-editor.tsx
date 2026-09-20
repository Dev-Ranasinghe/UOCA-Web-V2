"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ExternalLinkEntry = { label: string; url: string };

export function ExternalLinksEditor({
  name,
  initialLinks,
}: {
  /** Hidden input name carrying a JSON array of {label, url} on submit. */
  name: string;
  initialLinks: ExternalLinkEntry[];
}) {
  const [links, setLinks] = React.useState<ExternalLinkEntry[]>(
    initialLinks.length > 0 ? initialLinks : [],
  );

  const update = (index: number, patch: Partial<ExternalLinkEntry>) => {
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const remove = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const validLinks = links.filter((l) => l.label.trim() && l.url.trim());

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(validLinks)} />

      {links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((link, index) => (
            <li key={index} className="flex items-center gap-2">
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) => update(index, { label: e.target.value })}
                className="w-40"
              />
              <Input
                type="url"
                placeholder="https://…"
                value={link.url}
                onChange={(e) => update(index, { url: e.target.value })}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No external links added yet.</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
      >
        <Plus className="size-4" /> Add link
      </Button>
    </div>
  );
}
