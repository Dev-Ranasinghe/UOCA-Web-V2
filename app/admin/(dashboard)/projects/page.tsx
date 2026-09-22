import Link from "next/link";
import { FolderKanban, Plus, Pencil } from "lucide-react";
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
import { deleteProject } from "./actions";


export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        q ? { name: { contains: q, mode: "insensitive" } } : {},
        status ? { status: status as ContentStatus } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Official Leo Club projects — each can hold unlimited articles.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/projects/new">
              <Plus className="size-4" /> New project
            </Link>
          }
        />
      </div>

      <form className="flex max-w-md gap-2">
        <Input type="search" name="q" defaultValue={q} placeholder="Search projects…" />
      </form>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={q || status ? "No projects match your filters" : "No projects yet"}
          description="Create your first project, then add articles to it."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.startDate
                      ? project.startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project._count.articles}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={
                        <Link href={`/admin/projects/${project.id}/edit`}>
                          <Pencil />
                        </Link>
                      }
                    />
                    <DeleteButton
                      action={deleteProject.bind(null, project.id)}
                      itemLabel={project.name}
                      description={`This permanently deletes "${project.name}". Its articles aren't deleted, but they'll no longer be linked to a project. This cannot be undone.`}
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
