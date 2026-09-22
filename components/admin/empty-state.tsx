import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border-2 border-(color:--nb-ink) bg-(--nb-yellow) shadow-[3px_3px_0_var(--nb-ink)]">
          <Icon className="size-6" strokeWidth={1.75} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold">{title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
