import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AppRole } from "@/lib/auth-helpers";

const tokenOnly = z.object({ token: z.string().min(1) });

const approveSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
  fullName: z.string().min(1),
});

const rejectSchema = approveSchema;

const setRoleSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
  currentRoles: z.array(z.enum(["student", "teacher", "admin"])),
  nextRole: z.enum(["student", "teacher", "admin"]),
});

async function adminClient() {
  const { assertAdminToken } = await import("@/lib/admin-auth.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { assertAdminToken, supabaseAdmin };
}

export const fetchAdminDashboard = createServerFn({ method: "POST" })
  .validator(tokenOnly)
  .handler(async ({ data }) => {
    const { assertAdminToken, supabaseAdmin } = await adminClient();
    assertAdminToken(data.token);

    const [students, teachers, admins, notices, resources, events, profiles, roles, pending, logs] =
      await Promise.all([
        supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabaseAdmin.from("notices").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("resources").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("events").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id,role"),
        supabaseAdmin.from("profiles").select("*").eq("verification_status", "pending").order("created_at", { ascending: true }),
        supabaseAdmin.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

    const byUser = new Map<string, AppRole[]>();
    (roles.data ?? []).forEach((r) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      byUser.set(r.user_id, arr);
    });

    return {
      stats: {
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        admins: admins.count ?? 0,
        notices: notices.count ?? 0,
        resources: resources.count ?? 0,
        events: events.count ?? 0,
      },
      users: (profiles.data ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] })),
      pendingTeachers: pending.data ?? [],
      logs: logs.data ?? [],
    };
  });

export const adminApproveTeacher = createServerFn({ method: "POST" })
  .validator(approveSchema)
  .handler(async ({ data }) => {
    const { assertAdminToken, supabaseAdmin } = await adminClient();
    assertAdminToken(data.token);

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("id", data.userId);
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: "teacher" });
    if (roleErr) throw new Error(roleErr.message);

    await supabaseAdmin.from("activity_logs").insert({
      action: "teacher_approved",
      entity: "profiles",
      entity_id: data.userId,
      metadata: { full_name: data.fullName, via: "env_admin" },
    });
  });

export const adminRejectTeacher = createServerFn({ method: "POST" })
  .validator(rejectSchema)
  .handler(async ({ data }) => {
    const { assertAdminToken, supabaseAdmin } = await adminClient();
    assertAdminToken(data.token);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ verification_status: "rejected" })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("activity_logs").insert({
      action: "teacher_rejected",
      entity: "profiles",
      entity_id: data.userId,
      metadata: { full_name: data.fullName, via: "env_admin" },
    });
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .validator(setRoleSchema)
  .handler(async ({ data }) => {
    const { assertAdminToken, supabaseAdmin } = await adminClient();
    assertAdminToken(data.token);

    const { error: delErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);

    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.nextRole });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("activity_logs").insert({
      action: "role_change",
      entity: "user_roles",
      entity_id: data.userId,
      metadata: { from: data.currentRoles, to: data.nextRole, via: "env_admin" },
    });
  });
