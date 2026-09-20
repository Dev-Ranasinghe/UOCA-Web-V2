"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaPicker, type MediaSummary } from "@/components/admin/media-picker";
import { MemberCombobox, type MemberOption } from "@/components/admin/member-combobox";
import type { Project } from "@prisma/client";
import { createProject, updateProject, type ProjectActionState } from "./actions";

const initialState: ProjectActionState = {};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

function toMonthInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 7);
}

export function ProjectForm({
  project,
  coverImage,
  media,
  chairperson,
  secretary,
  treasurer,
  tagsValue,
}: {
  project?: Project;
  coverImage?: MediaSummary | null;
  media: MediaSummary[];
  chairperson?: MemberOption | null;
  secretary?: MemberOption | null;
  treasurer?: MemberOption | null;
  tagsValue: string;
}) {
  const action = project ? updateProject.bind(null, project.id) : createProject;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [status, setStatus] = React.useState(project?.status ?? "DRAFT");

  React.useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form
      key={project?.updatedAt?.toISOString() ?? "new"}
      action={formAction}
      className="max-w-3xl space-y-6"
    >
      <input type="hidden" name="status" value={status} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cover image</Label>
            <MediaPicker name="coverImageId" label="cover image" initialMedia={media} defaultValue={coverImage} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" defaultValue={project?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={project?.slug} placeholder="auto-generated from name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short description</Label>
            <Textarea
              id="shortDescription"
              name="shortDescription"
              rows={2}
              defaultValue={project?.shortDescription}
              placeholder="One or two sentences shown on project cards"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              items={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              value={status}
              onValueChange={(v) => setStatus((v ?? "DRAFT") as typeof status)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" name="tags" defaultValue={tagsValue} placeholder="comma, separated, tags" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start month</Label>
            <Input id="startDate" name="startDate" type="month" defaultValue={toMonthInputValue(project?.startDate)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End month</Label>
            <Input id="endDate" name="endDate" type="month" defaultValue={toMonthInputValue(project?.endDate)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leadership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chairperson</Label>
            <MemberCombobox name="chairpersonId" defaultValue={chairperson} placeholder="Select chairperson…" />
          </div>
          <div className="space-y-2">
            <Label>Project Secretary</Label>
            <MemberCombobox name="secretaryId" defaultValue={secretary} placeholder="Select secretary…" />
          </div>
          <div className="space-y-2">
            <Label>Project Treasurer</Label>
            <MemberCombobox name="treasurerId" defaultValue={treasurer} placeholder="Select treasurer…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" name="metaTitle" defaultValue={project?.metaTitle ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={project?.metaDescription ?? ""} />
          </div>
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
