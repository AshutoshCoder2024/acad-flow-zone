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

async function adminClient(token: string) {
  const { verifyAdminToken } = await import("@/lib/admin-auth.server");
  const { createServerSupabaseClient } = await import("@/integrations/supabase/server-client");
  verifyAdminToken(token);
  return { supabase: createServerSupabaseClient() };
}

export const fetchAdminDashboard = createServerFn({ method: "POST" })
  .validator(tokenOnly)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    const [students, teachers, admins, notices, resources, events, profiles, roles, pending, logs] =
      await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("notices").select("*", { count: "exact", head: true }),
        supabase.from("resources").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("profiles").select("*").eq("verification_status", "pending").order("created_at", { ascending: true }),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50),
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
    const { supabase } = await adminClient(data.token);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("id", data.userId);
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: "teacher" });
    if (roleErr) throw new Error(roleErr.message);

    await supabase.from("activity_logs").insert({
      action: "teacher_approved",
      entity: "profiles",
      entity_id: data.userId,
      metadata: { full_name: data.fullName, via: "env_admin" },
    });
  });

export const adminRejectTeacher = createServerFn({ method: "POST" })
  .validator(rejectSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "rejected" })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await supabase.from("activity_logs").insert({
      action: "teacher_rejected",
      entity: "profiles",
      entity_id: data.userId,
      metadata: { full_name: data.fullName, via: "env_admin" },
    });
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .validator(setRoleSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);

    const { error } = await supabase.from("user_roles").insert({ user_id: data.userId, role: data.nextRole });
    if (error) throw new Error(error.message);

    await supabase.from("activity_logs").insert({
      action: "role_change",
      entity: "user_roles",
      entity_id: data.userId,
      metadata: { from: data.currentRoles, to: data.nextRole, via: "env_admin" },
    });
  });

const noticeListSchema = z.object({
  token: z.string().min(1),
  search: z.string().optional(),
  priority: z.enum(["all", "low", "medium", "high"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(8),
});

const noticeCreateSchema = z.object({
  token: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(5000),
  priority: z.enum(["low", "medium", "high"]),
  attachmentBase64: z.string().optional(),
  attachmentName: z.string().optional(),
});

const noticeDeleteSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  attachmentUrl: z.string().nullable().optional(),
});

const resourceListSchema = z.object({
  token: z.string().min(1),
  search: z.string().optional(),
  type: z.enum(["all", "notes", "pyq", "lab_manual"]).optional(),
  semester: z.string().optional(),
});

const resourceCreateSchema = z.object({
  token: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  subject: z.string().trim().min(1).max(100),
  semester: z.coerce.number().int().min(1).max(12),
  type: z.enum(["notes", "pyq", "lab_manual"]),
  description: z.string().trim().max(2000).optional().nullable(),
  fileBase64: z.string().min(1),
  fileName: z.string().min(1).max(255),
});

const resourceDeleteSchema = z.object({
  token: z.string().min(1),
  id: z.string().uuid(),
  fileUrl: z.string(),
});

function decodeBase64(base64: string): Uint8Array {
  const binary = Buffer.from(base64, "base64");
  return new Uint8Array(binary);
}

export const adminFetchNotices = createServerFn({ method: "POST" })
  .validator(noticeListSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    const from = (data.page - 1) * data.pageSize;
    let q = supabase
      .from("notices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (data.search?.trim()) {
      q = q.or(`title.ilike.%${data.search.trim()}%,description.ilike.%${data.search.trim()}%`);
    }
    if (data.priority && data.priority !== "all") {
      q = q.eq("priority", data.priority);
    }

    const { data: rows, count, error } = await q.range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const adminCreateNotice = createServerFn({ method: "POST" })
  .validator(noticeCreateSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    let attachment_url: string | null = null;
    let attachment_name: string | null = null;

    if (data.attachmentBase64 && data.attachmentName) {
      const path = `admin/${Date.now()}-${data.attachmentName}`;
      const { error: upErr } = await supabase.storage
        .from("notice-attachments")
        .upload(path, decodeBase64(data.attachmentBase64), { contentType: "application/octet-stream" });
      if (upErr) throw new Error(upErr.message);
      attachment_url = path;
      attachment_name = data.attachmentName;
    }

    const { error } = await supabase.from("notices").insert({
      title: data.title,
      description: data.description,
      priority: data.priority,
      attachment_url,
      attachment_name,
      posted_by: null as unknown as string,
    });
    if (error) throw new Error(error.message);

    await supabase.from("activity_logs").insert({
      action: "notice_created",
      entity: "notices",
      metadata: { title: data.title, via: "env_admin" },
    });
  });

export const adminDeleteNotice = createServerFn({ method: "POST" })
  .validator(noticeDeleteSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    if (data.attachmentUrl) {
      await supabase.storage.from("notice-attachments").remove([data.attachmentUrl]);
    }

    const { error } = await supabase.from("notices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
  });

export const adminFetchResources = createServerFn({ method: "POST" })
  .validator(resourceListSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    let q = supabase.from("resources").select("*").order("created_at", { ascending: false });
    if (data.search?.trim()) {
      q = q.or(`title.ilike.%${data.search.trim()}%,subject.ilike.%${data.search.trim()}%`);
    }
    if (data.type && data.type !== "all") {
      q = q.eq("type", data.type);
    }
    if (data.semester && data.semester !== "all") {
      q = q.eq("semester", Number(data.semester));
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminCreateResource = createServerFn({ method: "POST" })
  .validator(resourceCreateSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    const path = `admin/${Date.now()}-${data.fileName}`;
    const { error: upErr } = await supabase.storage
      .from("resources")
      .upload(path, decodeBase64(data.fileBase64), { contentType: "application/octet-stream" });
    if (upErr) throw new Error(upErr.message);

    const { error } = await supabase.from("resources").insert({
      title: data.title,
      subject: data.subject,
      semester: data.semester,
      type: data.type,
      description: data.description ?? null,
      file_url: path,
      file_name: data.fileName,
      uploaded_by: null as unknown as string,
    });
    if (error) throw new Error(error.message);

    await supabase.from("activity_logs").insert({
      action: "resource_created",
      entity: "resources",
      metadata: { title: data.title, via: "env_admin" },
    });
  });

export const adminDeleteResource = createServerFn({ method: "POST" })
  .validator(resourceDeleteSchema)
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    await supabase.storage.from("resources").remove([data.fileUrl]);
    const { error } = await supabase.from("resources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
  });

export const adminGetSignedUrl = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(1),
      bucket: z.enum(["notice-attachments", "resources"]),
      path: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { supabase } = await adminClient(data.token);

    const { data: signed, error } = await supabase
      .storage.from(data.bucket)
      .createSignedUrl(data.path, 60);
    if (error) throw new Error(error.message);
    return signed.signedUrl;
  });
