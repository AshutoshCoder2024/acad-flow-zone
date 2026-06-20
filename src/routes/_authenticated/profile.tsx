import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — DeptPortal" }] }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  department: z.string().trim().max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional().or(z.literal("")),
});

function ProfilePage() {
  const { profile, role, refresh } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!profile) return <AppShell title="Profile">Loading...</AppShell>;

  const initials = (profile.full_name || profile.email).split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  async function handle(form: FormData) {
    const parsed = schema.safeParse({
      full_name: form.get("full_name"),
      department: form.get("department") || undefined,
      semester: form.get("semester") || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: parsed.data.full_name,
      department: parsed.data.department || null,
      semester: parsed.data.semester ? Number(parsed.data.semester) : null,
    }).eq("id", profile!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refresh();
  }

  return (
    <AppShell title="Profile" subtitle="Your account details.">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="surface-glow">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 font-display text-lg font-semibold">{profile.full_name || "Unnamed"}</h2>
            <Badge className="mt-1" variant="outline">{ROLE_LABEL[role]}</Badge>
            <p className="mt-3 text-xs text-muted-foreground break-all">{profile.email}</p>
            {profile.roll_number && <p className="mt-1 font-mono text-xs text-muted-foreground">{profile.roll_number}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Edit profile</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); handle(new FormData(e.currentTarget)); }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" defaultValue={profile.department ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="semester">Semester</Label>
                  <Input id="semester" name="semester" type="number" min={1} max={12} defaultValue={profile.semester ?? ""} />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
