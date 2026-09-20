"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaPicker, type MediaSummary } from "@/components/admin/media-picker";
import type { Category } from "@prisma/client";
import { createCategory, updateCategory, type CategoryActionState } from "./actions";

const initialState: CategoryActionState = {};

const KIND_LABELS: Record<string, string> = {
  PROJECT: "Project",
  BLOG: "Blog",
  GENERAL: "General (both)",
};

export function CategoryFormDialog({
  category,
  categoryImage,
  media,
}: {
  category?: Category;
  categoryImage?: MediaSummary | null;
  media: MediaSummary[];
}) {
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState(category?.kind ?? "GENERAL");
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      toast.success(category ? "Category updated" : "Category created");
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error, category]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          category ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" /> Add category
            </Button>
          )
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="kind" value={kind} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={category?.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={category?.slug} placeholder="auto-generated from name" />
          </div>

          <div className="space-y-2">
            <Label>Used for</Label>
            <Select
              items={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
              value={kind}
              onValueChange={(value) => setKind(value ?? "GENERAL")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(KIND_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={category?.description ?? ""} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <MediaPicker name="imageId" label="category image" initialMedia={media} defaultValue={categoryImage} />
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : category ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
