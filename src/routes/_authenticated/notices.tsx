import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Paperclip, Search, Trash2, Loader2, Download } from "lucide-react";
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
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 8;

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({ meta: [{ title: "Notices — DeptPortal" }] }),
  component: NoticesPage,
});

const noticeSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(5000),
  priority: z.enum(["low", "medium", "high"]),
});

function NoticesPage() {
  const { role, user } = useAuth();
  const canPost = role === "teacher" || role === "admin";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["notices", { search, priority, page }],
    queryFn: async () => {
      let q = supabase
        .from("notices")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (search.trim()) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      if (priority !== "all") q = q.eq("priority", priority as "low" | "medium" | "high");
      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));

  async function handleCreate(form: FormData, file: File | null) {
    if (!user) return;
    const parsed = noticeSchema.safeParse({
      title: form.get("title"),
      description: form.get("description"),
      priority: form.get("priority"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    let attachment_url: string | null = null;
    let attachment_name: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("notice-attachments").upload(path, file);
      if (upErr) return toast.error(upErr.message);
      attachment_url = path;
      attachment_name = file.name;
    }

    const { error } = await supabase.from("notices").insert({
      ...parsed.data,
      attachment_url,
      attachment_name,
      posted_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Notice posted");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["notices"] });
    qc.invalidateQueries({ queryKey: ["recent-notices"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["notices"] });
  }

  async function downloadAttachment(path: string, name: string) {
    const { data, error } = await supabase.storage.from("notice-attachments").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  }

  return (
    <AppShell
      title="Notices"
      subtitle="Pinned by priority. Stay informed."
      actions={
        canPost && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New notice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post a new notice</DialogTitle>
                <DialogDescription>Visible to all users.</DialogDescription>
              </DialogHeader>
              <NoticeForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        )
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search notices..."
            className="pl-9"
          />
        </div>
        <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {query.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : query.data?.rows.length ? (
          query.data.rows.map((n) => {
            const canDelete = role === "admin" || n.posted_by === user?.id;
            return (
              <Card key={n.id} className="surface-glow transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold">{n.title}</h3>
                        <PriorityBadge p={n.priority} />
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                        {n.attachment_url && n.attachment_name && (
                          <button
                            onClick={() => downloadAttachment(n.attachment_url!, n.attachment_name!)}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Paperclip className="h-3 w-3" /> {n.attachment_name}
                          </button>
                        )}
                      </div>
                    </div>
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No notices found.</CardContent></Card>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
            </PaginationItem>
            {Array.from({ length: totalPages }).slice(0, 6).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </AppShell>
  );
}

function NoticeForm({ onSubmit }: { onSubmit: (f: FormData, file: File | null) => Promise<unknown> }) {
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
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={5} required />
      </div>
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select name="priority" defaultValue="medium">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="file">Attachment (optional)</Label>
        <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post notice
        </Button>
      </DialogFooter>
    </form>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const v: Record<string, "default" | "secondary" | "destructive"> = {
    high: "destructive", medium: "default", low: "secondary",
  };
  return <Badge variant={v[p] ?? "secondary"} className="capitalize">{p}</Badge>;
}
