import Link from "next/link";
import { Users, Plus, Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteMember } from "./actions";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const members = await prisma.member.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { clubRole: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { fullName: "asc" },
    include: { profileImage: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People / Members</h1>
          <p className="text-sm text-muted-foreground">
            The reusable directory behind authors, chairpersons, secretaries, treasurers, and
            participants.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/members/new">
              <Plus className="size-4" /> Add member
            </Link>
          }
        />
      </div>

      <form className="max-w-sm">
        <Input type="search" name="q" defaultValue={q} placeholder="Search by name, email, role…" />
      </form>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No members match your search" : "No members yet"}
          description="Every author, chairperson, secretary, treasurer, and participant is chosen from this directory."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={member.profileImage?.url} alt={member.displayName} />
                        <AvatarFallback>{initials(member.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-xs text-muted-foreground">{member.email ?? "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.clubRole ?? "—"}</TableCell>
                  <TableCell className="flex flex-wrap gap-1">
                    {!member.isActive ? <Badge variant="outline">Inactive</Badge> : null}
                    {member.isTeamMember ? <Badge variant="secondary">{member.teamCategory}</Badge> : null}
                    {member.isAuthor ? <Badge variant="secondary">Author</Badge> : null}
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={
                        <Link href={`/admin/members/${member.id}/edit`}>
                          <Pencil />
                        </Link>
                      }
                    />
                    <DeleteButton
                      action={deleteMember.bind(null, member.id)}
                      itemLabel={member.fullName}
                      description={`This permanently deletes "${member.fullName}" and removes them from every project or article they're linked to. This cannot be undone.`}
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
