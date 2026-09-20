"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { recordMedia } from "./actions";

function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return Promise.resolve({});
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({});
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function MediaUploadButton() {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    let succeeded = 0;

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
        const path = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);
        const dims = await readImageDimensions(file);

        await recordMedia({
          storagePath: path,
          url: publicUrlData.publicUrl,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          width: dims.width,
          height: dims.height,
        });
        succeeded += 1;
      }
      toast.success(succeeded > 1 ? `${succeeded} files uploaded` : "File uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Upload
      </Button>
    </>
  );
}
