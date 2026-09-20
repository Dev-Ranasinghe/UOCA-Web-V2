import { MapPin } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/admin/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocationFormDialog } from "./location-form-dialog";
import { deleteLocation } from "./actions";

export default async function AdminLocationsPage() {
  await requireAdmin();

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground">
            Reusable places attached to Projects and Articles.
          </p>
        </div>
        <LocationFormDialog />
      </div>

      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add the places your projects and events happen at — you'll pick from this list when creating a project."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="text-muted-foreground">{location.city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{location.district ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{location.country ?? "—"}</TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <LocationFormDialog location={location} />
                    <DeleteButton
                      action={deleteLocation.bind(null, location.id)}
                      itemLabel={location.name}
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
