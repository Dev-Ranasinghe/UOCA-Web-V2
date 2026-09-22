import { Badge } from "@/components/ui/badge";

// Each content status is its own ribbon (colour + notch), see the Badge rules in app/admin/admin-theme.css.
const STATUS_STYLE: Record<string, { label: string; tone: string; notch: string }> = {
  PUBLISHED: { label: "Published", tone: "green", notch: "start" },
  DRAFT: { label: "Draft", tone: "yellow", notch: "none" },
  ARCHIVED: { label: "Archived", tone: "blue", notch: "end" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? { label: status, tone: "white", notch: "none" };
  return (
    <Badge variant="outline" data-tone={style.tone} data-notch={style.notch}>
      {style.label}
    </Badge>
  );
}
