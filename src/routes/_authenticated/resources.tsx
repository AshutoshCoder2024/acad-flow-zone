import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Download, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const TYPES = [
  { value: "notes", label: "Notes" },
  { value: "pyq", label: "PYQ" },
  { value: "lab_manual", label: "Lab Manual" },
];

const resourceSchema = z.object({
  title: z.string().trim().min(3).max(200),
  subject: z.string().trim().min(1).max(100),
  semester: z.coerce.number().int().min(1).max(12),
  type: z.enum(["notes", "pyq", "lab_manual"]),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({ meta: [{ title: "Resources & PYQ — DeptPortal" }] }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { role, user } = useAuth();
  const canUpload = role === "teacher" || role === "admin";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["resources", { search, type, semester }],
    queryFn: async () => {
      let q = supabase.from("resources").select("*").order("created_at", { ascending: false });
      if (search.trim()) q = q.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
      if (type !== "all") q = q.eq("type", type as "notes" | "pyq" | "lab_manual");
      if (semester !== "all") q = q.eq("semester", Number(semester));
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleCreate(form: FormData, file: File | null) {
    if (!user) return;
    if (!file) return toast.error("File required");
    const parsed = resourceSchema.safeParse({
      title: form.get("title"),
      subject: form.get("subject"),
      semester: form.get("semester"),
      type: form.get("type"),
      description: form.get("description") || null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("resources").upload(path, file);
    if (upErr) return toast.error(upErr.message);
    const { error } = await supabase.from("resources").insert({
      ...parsed.data,
      file_url: path,
      file_name: file.name,
      uploaded_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Resource uploaded");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["resources"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  async function handleDelete(id: string, path: string) {
    if (!confirm("Delete this resource?")) return;
    await supabase.storage.from("resources").remove([path]);
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["resources"] });
  }

  async function download(path: string, name: string) {
    const { data, error } = await supabase.storage.from("resources").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  }

  return (
    <AppShell
      title="Resources & PYQ"
      subtitle="Notes, past-year papers, and lab manuals — searchable and downloadable."
      actions={
        canUpload && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload resource</DialogTitle>
                <DialogDescription>PDF files recommended.</DialogDescription>
              </DialogHeader>
              <ResourceForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        )
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or subject..." className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {Array.from({ length: 8 }).map((_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>Semester {i + 1}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : query.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((r) => {
            const canDelete = role === "admin" || r.uploaded_by === user?.id;
            return (
              <Card key={r.id} className="surface-glow flex flex-col">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="capitalize">{r.type.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug">{r.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{r.subject} • Semester {r.semester}</p>
                  {r.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                  <div className="mt-auto flex gap-2 pt-4">
                    <Button size="sm" variant="default" className="flex-1" onClick={() => download(r.file_url, r.file_name)}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Download
                    </Button>
                    {canDelete && (
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id, r.file_url)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No resources found.</CardContent></Card>
      )}
    </AppShell>
  );
}

function ResourceForm({ onSubmit }: { onSubmit: (f: FormData, file: File | null) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(new FormData(e.currentTarget), file);
        setSubmitting(false);
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2"><Label>Title</Label><Input name="title" required /></div>
        <div className="space-y-1.5"><Label>Subject</Label><Input name="subject" required /></div>
        <div className="space-y-1.5"><Label>Semester</Label><Input name="semester" type="number" min={1} max={12} required /></div>
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select name="type" defaultValue="notes">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea name="description" rows={3} /></div>
      <div className="space-y-1.5"><Label>File</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
        </Button>
      </DialogFooter>
    </form>
  );
}
