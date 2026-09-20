"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Location } from "@prisma/client";
import { createLocation, updateLocation, type LocationActionState } from "./actions";

const initialState: LocationActionState = {};

export function LocationFormDialog({ location }: { location?: Location }) {
  const [open, setOpen] = React.useState(false);
  const action = location ? updateLocation.bind(null, location.id) : createLocation;
  const [state, formAction, pending] = useActionState(action, initialState);
  const wasPending = React.useRef(false);

  React.useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      toast.success(location ? "Location updated" : "Location created");
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state.error, location]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          location ? (
            <Button variant="ghost" size="icon-sm">
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" /> Add location
            </Button>
          )
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{location ? "Edit location" : "New location"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={location?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={location?.address ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={location?.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" name="district" defaultValue={location?.district ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Input id="province" name="province" defaultValue={location?.province ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={location?.country ?? "Sri Lanka"} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapUrl">Map URL</Label>
            <Input id="mapUrl" name="mapUrl" defaultValue={location?.mapUrl ?? ""} placeholder="https://maps.google.com/..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" name="latitude" type="number" step="any" defaultValue={location?.latitude ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" name="longitude" type="number" step="any" defaultValue={location?.longitude ?? ""} />
            </div>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : location ? "Save changes" : "Create location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
