import { Image as ImageIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { MediaUploadButton } from "./media-upload-button";
import { deleteMedia } from "./actions";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminMediaPage() {
  await requireAdmin();

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
          <p className="text-sm text-muted-foreground">
            The shared image library used across projects, articles, and profiles.
          </p>
        </div>
        <MediaUploadButton />
      </div>

      {media.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No media yet"
          description="Upload an image to make it available everywhere — projects, articles, and member profiles all pick from this same library."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {media.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border">
              <div className="aspect-square bg-muted">
                {item.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.altText ?? item.fileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.fileName}</p>
                  <p className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</p>
                </div>
                <DeleteButton
                  action={deleteMedia.bind(null, item.id)}
                  itemLabel={item.fileName}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
