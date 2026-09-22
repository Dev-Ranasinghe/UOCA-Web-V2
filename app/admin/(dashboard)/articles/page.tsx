import Link from "next/link";
import { Newspaper, Plus, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContentStatus } from "@prisma/client";
import { deleteArticle } from "./actions";


const LIST_PATH = "/admin/articles";

export default async function AdminBlogArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const articles = await prisma.article.findMany({
    where: {
      AND: [
        { projectId: null },
        q ? { title: { contains: q, mode: "insensitive" } } : {},
        status ? { status: status as ContentStatus } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog / Articles</h1>
          <p className="text-sm text-muted-foreground">
            General content that isn&apos;t tied to a specific project — meetings, district
            events, club news.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/articles/new">
              <Plus className="size-4" /> New article
            </Link>
          }
        />
      </div>

      <form className="flex max-w-md gap-2">
        <Input type="search" name="q" defaultValue={q} placeholder="Search articles…" />
      </form>

      {articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={q || status ? "No articles match your filters" : "No blog articles yet"}
          description="Create your first blog article."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.category?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={article.status} />
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          <Pencil />
                        </Link>
                      }
                    />
                    <DeleteButton
                      action={deleteArticle.bind(null, article.id, LIST_PATH)}
                      itemLabel={article.title}
                      description={`This permanently deletes "${article.title}". This cannot be undone.`}
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
