"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaPicker, type MediaSummary } from "@/components/admin/media-picker";
import type { Member } from "@prisma/client";
import { createMember, updateMember, type MemberActionState } from "./actions";

const initialState: MemberActionState = {};

type SocialLinks = { linkedin?: string; instagram?: string; whatsapp?: string };

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  SINGLE: "Single",
  TAKEN: "Taken",
  LOOKING: "Looking for a relationship",
  NOT_INTERESTED: "Not interested",
};

export function MemberForm({
  member,
  profileImage,
  media,
}: {
  member?: Member;
  profileImage?: MediaSummary | null;
  media: MediaSummary[];
}) {
  const action = member ? updateMember.bind(null, member.id) : createMember;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [isActive, setIsActive] = React.useState(member?.isActive ?? true);
  const [isTeamMember, setIsTeamMember] = React.useState(member?.isTeamMember ?? false);
  const [isAuthor, setIsAuthor] = React.useState(member?.isAuthor ?? false);
  const [teamCategory, setTeamCategory] = React.useState(member?.teamCategory ?? "EXCO");
  const [gender, setGender] = React.useState(member?.gender ?? "");
  const [relationshipStatus, setRelationshipStatus] = React.useState(member?.relationshipStatus ?? "");
  const [isNewLeo, setIsNewLeo] = React.useState(member?.isNewLeo ?? true);

  const social = (member?.socialLinks as SocialLinks | null) ?? {};

  function toDateInputValue(date: Date | null | undefined) {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 10);
  }

  React.useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form
      key={member?.updatedAt?.toISOString() ?? "new"}
      action={formAction}
      className="space-y-6"
    >
      <input type="hidden" name="isActive" value={isActive ? "on" : ""} />
      <input type="hidden" name="isTeamMember" value={isTeamMember ? "on" : ""} />
      <input type="hidden" name="isAuthor" value={isAuthor ? "on" : ""} />
      <input type="hidden" name="isNewLeo" value={isNewLeo ? "on" : ""} />
      <input type="hidden" name="gender" value={gender} />
      <input type="hidden" name="relationshipStatus" value={relationshipStatus} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <MediaPicker name="profileImageId" label="profile photo" initialMedia={media} defaultValue={profileImage} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" defaultValue={member?.fullName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={member?.displayName} placeholder="defaults to full name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={member?.slug} placeholder="auto-generated from name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={member?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={member?.phone ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leoDesignation">Leo designation</Label>
              <Input id="leoDesignation" name="leoDesignation" defaultValue={member?.leoDesignation ?? ""} placeholder="e.g. Leo, Lion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubRole">Club role</Label>
              <Input id="clubRole" name="clubRole" defaultValue={member?.clubRole ?? ""} placeholder="e.g. President" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" rows={3} defaultValue={member?.bio ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mylciId">MyLCI ID</Label>
              <Input id="mylciId" name="mylciId" defaultValue={member?.mylciId ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={member?.city ?? ""} placeholder="City they live in" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birthdate</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={toDateInputValue(member?.birthDate)}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                items={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
                value={gender}
                onValueChange={(v) => setGender(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Relationship status</Label>
            <Select
              items={Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => ({ value, label }))}
              value={relationshipStatus}
              onValueChange={(v) => setRelationshipStatus(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leo history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isNewLeo} onCheckedChange={(v) => setIsNewLeo(v === true)} />
            New Leo (no prior Leo experience)
          </label>
          {!isNewLeo ? (
            <div className="space-y-2">
              <Label htmlFor="leoExperience">Previous experience & designations</Label>
              <Textarea
                id="leoExperience"
                name="leoExperience"
                rows={3}
                defaultValue={member?.leoExperience ?? ""}
                placeholder="e.g. Leo Club of XYZ — Secretary (2023-2024)"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" name="linkedin" defaultValue={social.linkedin ?? ""} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" name="instagram" defaultValue={social.instagram ?? ""} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={social.whatsapp ?? ""} placeholder="https://wa.me/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visibility & roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isAuthor} onCheckedChange={(v) => setIsAuthor(v === true)} />
            Can be selected as an article author
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isTeamMember} onCheckedChange={(v) => setIsTeamMember(v === true)} />
            Show on the public Team page
          </label>
          {isTeamMember ? (
            <div className="space-y-2 pl-6">
              <Label>Team category</Label>
              <input type="hidden" name="teamCategory" value={teamCategory} />
              <Select
                items={[
                  { value: "EXCO", label: "EXCO" },
                  { value: "HEAD", label: "HEAD" },
                  { value: "DIRECTOR", label: "DIRECTOR" },
                ]}
                value={teamCategory}
                onValueChange={(v) => setTeamCategory(v ?? "EXCO")}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCO">EXCO</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="DIRECTOR">DIRECTOR</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="teamSortOrder">Sort order within category</Label>
              <Input
                id="teamSortOrder"
                name="teamSortOrder"
                type="number"
                className="w-24"
                defaultValue={member?.teamSortOrder ?? 0}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : member ? "Save changes" : "Create member"}
        </Button>
      </div>
    </form>
  );
}
