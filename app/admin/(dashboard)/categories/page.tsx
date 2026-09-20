import { Tags } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryFormDialog } from "./category-form-dialog";
import { deleteCategory } from "./actions";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const [categories, media] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, include: { image: true } }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, url: true, fileName: true, mimeType: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Shared taxonomy for both Projects and Blog Articles.
          </p>
        </div>
        <CategoryFormDialog media={media} />
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Categories organize both projects and blog articles — create the ones your club uses."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Used for</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.kind}</Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <CategoryFormDialog category={category} categoryImage={category.image} media={media} />
                    <DeleteButton
                      action={deleteCategory.bind(null, category.id)}
                      itemLabel={category.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
