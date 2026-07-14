"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/(app)/projects/actions";
import { createClient } from "@/lib/supabase/client";
import { uploadProjectCover } from "@/lib/services/storage";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES, type ProjectStatus } from "@/lib/types";
import type { ProjectWithProgress } from "@/lib/types";

const NO_TEMPLATE_VALUE = "none";

export function ProjectFormDialog({
  project,
  templates = [],
  trigger,
}: {
  project?: ProjectWithProgress;
  templates?: { id: string; name: string }[];
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const isEditing = !!project;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [clientName, setClientName] = useState(project?.client_name ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "actief");
  const [description, setDescription] = useState(project?.description ?? "");
  const [startDate, setStartDate] = useState(project?.start_date ?? "");
  const [endDate, setEndDate] = useState(project?.end_date ?? "");
  const [templateId, setTemplateId] = useState<string>(NO_TEMPLATE_VALUE);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    project?.cover_image_url ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let finalCoverUrl = project?.cover_image_url ?? null;
      if (coverFile) {
        const supabaseBrowser = createClient();
        finalCoverUrl = await uploadProjectCover(supabaseBrowser, coverFile);
      }

      const input = {
        name,
        client_name: clientName || null,
        status,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        cover_image_url: finalCoverUrl,
      };

      if (isEditing) {
        await updateProjectAction(project.id, input);
        toast.success("Project bijgewerkt");
      } else {
        await createProjectAction(
          input,
          templateId === NO_TEMPLATE_VALUE ? undefined : templateId
        );
        toast.success("Project aangemaakt");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(isEditing ? "Bijwerken mislukt" : "Aanmaken mislukt", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Project bewerken" : "Nieuw project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cover_image">Cover</Label>
            <label
              htmlFor="cover_image"
              className="flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 bg-cover bg-center hover:bg-muted/60"
              style={
                coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined
              }
            >
              {!coverPreview && (
                <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <ImagePlus className="size-5" />
                  Cover-afbeelding kiezen
                </span>
              )}
            </label>
            <input
              id="cover_image"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleCoverChange}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Naam</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {!isEditing && templates.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="template">Sjabloon (optioneel)</Label>
              <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? NO_TEMPLATE_VALUE)}>
                <SelectTrigger id="template" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      value === NO_TEMPLATE_VALUE
                        ? "Geen sjabloon"
                        : templates.find((t) => t.id === value)?.name
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_TEMPLATE_VALUE}>Geen sjabloon</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Voegt de taken uit het sjabloon direct toe aan dit project.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="client_name">Klantnaam</Label>
            <Input
              id="client_name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue>
                  {(value: ProjectStatus) => PROJECT_STATUS_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">Startdatum</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate ?? ""}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end_date">Einddatum</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate ?? ""}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea
              id="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Bezig..." : isEditing ? "Opslaan" : "Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
