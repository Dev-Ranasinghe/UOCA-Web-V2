"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { setMaintenanceMode } from "./actions";

export function MaintenanceCard({ initial, canEdit, ownerEmail }: { initial: boolean; canEdit: boolean; ownerEmail: string }) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    const previous = enabled;
    setEnabled(next); // optimistic; put back if the server says no
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof setMaintenanceMode>>;
      try {
        result = await setMaintenanceMode(next);
      } catch {
        // The request never got an answer (network, or the page is from an older deploy): refresh and try again.
        result = { ok: false, error: "Could not reach the server. Refresh the page and try again." };
      }
      if (!result.ok) {
        setEnabled(previous);
        toast.error(result.error);
        return;
      }
      toast.success(result.enabled ? "Maintenance mode is on. Visitors now see the wait page." : "Maintenance mode is off. The site is live.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Maintenance mode</CardTitle>
            <CardDescription>
              While this is on, every public page sends visitors to a &ldquo;we&rsquo;ll be right back&rdquo; page with LYNX, and
              that page opens the site by itself when you switch this off. The dashboard keeps working, but the public site is
              closed to everyone, admins included, until you switch this off. Changes reach visitors within a few seconds.
            </CardDescription>
          </div>
          <Badge variant={enabled ? "destructive" : "secondary"} className="shrink-0">
            {enabled ? "Maintenance on" : "Site live"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <label htmlFor="maintenance-switch" className="font-medium">
            Show the maintenance page to visitors
          </label>
          <Switch
            id="maintenance-switch"
            checked={enabled}
            onCheckedChange={onChange}
            disabled={!canEdit || pending}
            aria-label="Maintenance mode"
          />
        </div>

        {!canEdit ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden="true" />
            Only {ownerEmail} can change this.
          </p>
        ) : null}

        <a
          href="/maintenance?preview=1"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Preview the maintenance page <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </CardContent>
    </Card>
  );
}
