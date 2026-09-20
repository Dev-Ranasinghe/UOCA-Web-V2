"use client";

import * as React from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { recordMedia } from "@/app/admin/(dashboard)/media/actions";

export type MediaSummary = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
};

export function MediaPicker({
  name,
  label = "image",
  initialMedia,
  defaultValue,
}: {
  /** Hidden input name carrying the selected media id in the form submit. */
  name: string;
  label?: string;
  initialMedia: MediaSummary[];
  defaultValue?: MediaSummary | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(initialMedia);
  const [selected, setSelected] = React.useState<MediaSummary | null>(defaultValue ?? null);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
      const path = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const media = await recordMedia({
        storagePath: path,
        url: data.publicUrl,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });
      const summary: MediaSummary = {
        id: media.id,
        url: media.url,
        fileName: media.fileName,
        mimeType: media.mimeType,
      };
      setItems((prev) => [summary, ...prev]);
      setSelected(summary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {selected ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.url} alt={selected.fileName} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" size="sm">
                  Choose {label}
                </Button>
              }
            />
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="capitalize">Select {label}</DialogTitle>
              </DialogHeader>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleUpload(e.target.files)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Upload new
              </Button>

              <div className="grid max-h-96 grid-cols-4 gap-3 overflow-y-auto pt-2">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setSelected(item);
                      setOpen(false);
                    }}
                    className={cn(
                      "aspect-square overflow-hidden rounded-md border-2",
                      selected?.id === item.id ? "border-primary" : "border-transparent",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.fileName} className="h-full w-full object-cover" />
                  </button>
                ))}
                {items.length === 0 ? (
                  <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">
                    No media yet — upload one above.
                  </p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
          {selected ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <X className="size-4" /> Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
