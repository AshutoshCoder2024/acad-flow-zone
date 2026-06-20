import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar as CalIcon, ExternalLink, Trash2, Loader2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const eventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(5000),
  event_date: z.string().min(1),
  registration_link: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events — DeptPortal" }] }),
  component: EventsPage,
});

function EventsPage() {
  const { role, user } = useAuth();
  const canCreate = role === "teacher" || role === "admin";
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"upcoming" | "completed" | "all">("upcoming");
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("event_date", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleCreate(form: FormData) {
    if (!user) return;
    const parsed = eventSchema.safeParse({
      title: form.get("title"),
      description: form.get("description"),
      event_date: form.get("event_date"),
      registration_link: form.get("registration_link") || "",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const date = new Date(parsed.data.event_date);
    const { error } = await supabase.from("events").insert({
      title: parsed.data.title,
      description: parsed.data.description,
      event_date: date.toISOString(),
      registration_link: parsed.data.registration_link || null,
      status: date > new Date() ? "upcoming" : "completed",
      created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Event created");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? Its gallery will be removed too.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["events"] });
  }

  return (
    <AppShell
      title="Events"
      subtitle="Workshops, fests, talks — past and upcoming."
      actions={
        canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> Event</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create event</DialogTitle></DialogHeader>
              <EventForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        )
      }
    >
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : query.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {query.data.map((e) => {
            const canDelete = role === "admin" || e.created_by === user?.id;
            return (
              <Card key={e.id} className="surface-glow flex flex-col overflow-hidden">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant={e.status === "upcoming" ? "default" : "secondary"} className="capitalize">{e.status}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalIcon className="h-3 w-3" />
                      {new Date(e.event_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-tight">{e.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/events/$id" params={{ id: e.id }}>Gallery</Link>
                    </Button>
                    {e.registration_link && (
                      <Button asChild size="sm" variant="default">
                        <a href={e.registration_link} target="_blank" rel="noreferrer noopener">
                          Register <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="icon" variant="ghost" className="ml-auto" onClick={() => handleDelete(e.id)} aria-label="Delete">
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
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No events.</CardContent></Card>
      )}
    </AppShell>
  );
}

function EventForm({ onSubmit }: { onSubmit: (f: FormData) => Promise<unknown> }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(new FormData(e.currentTarget));
        setSubmitting(false);
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5"><Label>Title</Label><Input name="title" required /></div>
      <div className="space-y-1.5"><Label>Description</Label><Textarea name="description" rows={4} required /></div>
      <div className="space-y-1.5"><Label>Event date</Label><Input name="event_date" type="datetime-local" required /></div>
      <div className="space-y-1.5"><Label>Registration link (optional)</Label><Input name="registration_link" type="url" placeholder="https://..." /></div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
        </Button>
      </DialogFooter>
    </form>
  );
}
