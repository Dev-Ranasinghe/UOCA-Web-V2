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
import { AuthorManager, type AuthorEntry } from "@/components/admin/author-manager";
import { ParticipantManager, type ParticipantEntry } from "@/components/admin/participant-manager";
import { ExternalLinksEditor, type ExternalLinkEntry } from "@/components/admin/external-links-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { Article, Category, Location, Project } from "@prisma/client";
import { createArticle, updateArticle, type ArticleActionState } from "./actions";

const initialState: ArticleActionState = {};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function ArticleForm({
  mode,
  listPath,
  article,
  featuredImage,
  projects,
  categories,
  locations,
  media,
  authors,
  participants,
  externalLinks,
  tagsValue,
}: {
  mode: "project" | "blog";
  listPath: string;
  article?: Article;
  featuredImage?: MediaSummary | null;
  /** Only used in "project" mode. */
  projects?: Pick<Project, "id" | "name">[];
  /** Only used in "blog" mode — project articles don't have a category. */
  categories?: Category[];
  locations: Location[];
  media: MediaSummary[];
  authors: AuthorEntry[];
  participants: ParticipantEntry[];
  externalLinks: ExternalLinkEntry[];
  tagsValue: string;
}) {
  const action = article
    ? updateArticle.bind(null, article.id, mode, listPath)
    : createArticle.bind(null, mode, listPath);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [projectId, setProjectId] = React.useState(article?.projectId ?? "");
  const [categoryId, setCategoryId] = React.useState(article?.categoryId ?? "");
  const [locationId, setLocationId] = React.useState(article?.locationId ?? "");
  const [status, setStatus] = React.useState(article?.status ?? "DRAFT");

  React.useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form
      key={article?.updatedAt?.toISOString() ?? "new"}
      action={formAction}
      className="max-w-3xl space-y-6"
    >
      {mode === "project" ? <input type="hidden" name="projectId" value={projectId} /> : null}
      {mode === "blog" ? <input type="hidden" name="categoryId" value={categoryId} /> : null}
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="status" value={status} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Featured image</Label>
            <MediaPicker
              name="featuredImageId"
              label="featured image"
              initialMedia={media}
              defaultValue={featuredImage}
            />
          </div>

          {mode === "project" ? (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                items={(projects ?? []).map((p) => ({ value: p.id, label: p.name }))}
                value={projectId}
                onValueChange={(v) => setProjectId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project…" />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={article?.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={article?.slug} placeholder="auto-generated from title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" name="subtitle" defaultValue={article?.subtitle ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              defaultValue={article?.excerpt ?? ""}
              placeholder="One or two sentences shown on article cards"
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor name="content" defaultValue={article?.content} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mode === "blog" ? (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  items={(categories ?? []).map((cat) => ({ value: cat.id, label: cat.name }))}
                  value={categoryId}
                  onValueChange={(v) => setCategoryId(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" name="tags" defaultValue={tagsValue} placeholder="comma, separated, tags" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event details (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input id="eventDate" name="eventDate" type="date" defaultValue={toDateInputValue(article?.eventDate)} />
            </div>
            <div />
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" name="startTime" defaultValue={article?.startTime ?? ""} placeholder="e.g. 9:00 AM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" name="endTime" defaultValue={article?.endTime ?? ""} placeholder="e.g. 4:00 PM" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              items={locations.map((loc) => ({ value: loc.id, label: loc.name }))}
              value={locationId}
              onValueChange={(v) => setLocationId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authors</CardTitle>
        </CardHeader>
        <CardContent>
          <AuthorManager name="authorIdsJson" initialAuthors={authors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantManager name="participantsJson" initialParticipants={participants} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">External links</CardTitle>
        </CardHeader>
        <CardContent>
          <ExternalLinksEditor name="externalLinksJson" initialLinks={externalLinks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" name="metaTitle" defaultValue={article?.metaTitle ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={article?.metaDescription ?? ""} />
          </div>
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : article ? "Save changes" : "Create article"}
        </Button>
      </div>
    </form>
  );
}
