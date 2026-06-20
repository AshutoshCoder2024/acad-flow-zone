import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({ meta: [{ title: "Event — DeptPortal" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { role, user } = useAuth();
  const canUpload = role === "teacher" || role === "admin";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [signedMap, setSignedMap] = useState<Record<string, string>>({});

  const event = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const gallery = useQuery({
    queryKey: ["event-gallery", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery").select("*").eq("event_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    (async () => {
      if (!gallery.data?.length) return;
      const paths = gallery.data.map((g) => g.image_url);
      const { data } = await supabase.storage.from("gallery").createSignedUrls(paths, 600);
      const m: Record<string, string> = {};
      data?.forEach((d, i) => { if (d.signedUrl) m[paths[i]] = d.signedUrl; });
      setSignedMap(m);
    })();
  }, [gallery.data]);

  async function handleUpload(file: File, caption: string) {
    if (!user) return;
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
    if (upErr) return toast.error(upErr.message);
    const { error } = await supabase.from("gallery").insert({
      event_id: id, image_url: path, caption: caption || null, uploaded_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Uploaded");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["event-gallery", id] });
  }

  async function handleDelete(galleryId: string, path: string) {
    if (!confirm("Remove this image?")) return;
    await supabase.storage.from("gallery").remove([path]);
    const { error } = await supabase.from("gallery").delete().eq("id", galleryId);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["event-gallery", id] });
  }

  return (
    <AppShell
      title={event.data?.title ?? "Event"}
      subtitle={event.data ? new Date(event.data.event_date).toLocaleString() : ""}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/events"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
          {canUpload && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Photo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add gallery photo</DialogTitle></DialogHeader>
                <UploadForm onSubmit={handleUpload} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      }
    >
      {event.isLoading ? <Skeleton className="h-24 w-full" /> : event.data && (
        <Card className="mb-6"><CardContent className="p-5">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.data.description}</p>
        </CardContent></Card>
      )}

      <h2 className="font-display mb-3 text-lg font-semibold">Gallery</h2>
      {gallery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      ) : gallery.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {gallery.data.map((g) => {
            const canDel = role === "admin" || g.uploaded_by === user?.id;
            return (
              <div key={g.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                {signedMap[g.image_url] ? (
                  <img src={signedMap[g.image_url]} alt={g.caption ?? ""} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : <Skeleton className="h-full w-full" />}
                {g.caption && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white">{g.caption}</div>}
                {canDel && (
                  <Button size="icon" variant="destructive" className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => handleDelete(g.id, g.image_url)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No photos yet.</CardContent></Card>
      )}
    </AppShell>
  );
}

function UploadForm({ onSubmit }: { onSubmit: (file: File, caption: string) => Promise<unknown> }) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return toast.error("Pick an image");
        setSubmitting(true);
        const caption = (new FormData(e.currentTarget).get("caption") as string) || "";
        await onSubmit(file, caption);
        setSubmitting(false);
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5"><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></div>
      <div className="space-y-1.5"><Label>Caption (optional)</Label><Input name="caption" /></div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
        </Button>
      </DialogFooter>
    </form>
  );
}
