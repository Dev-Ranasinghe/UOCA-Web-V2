"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CONFIRM_CODE = "6969";

export function DeleteButton({
  action,
  itemLabel,
  title = "Delete this item?",
  description,
}: {
  /** Bound server action, e.g. `deleteMember.bind(null, member.id)`. */
  action: () => Promise<void>;
  itemLabel: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [code, setCode] = React.useState("");

  const handleConfirm = async () => {
    setPending(true);
    try {
      await action();
      toast.success(`${itemLabel} deleted`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCode("");
      }}
    >
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? `This permanently deletes "${itemLabel}". This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-confirm-code">
            Type <span className="font-mono font-semibold">{CONFIRM_CODE}</span> to confirm
          </Label>
          <Input
            id="delete-confirm-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={pending}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={pending || code !== CONFIRM_CODE}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
