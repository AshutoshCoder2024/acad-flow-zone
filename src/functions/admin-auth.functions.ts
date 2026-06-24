import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminSignInSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(128),
});

const tokenOnly = z.object({ token: z.string().min(1) });

export const adminLogin = createServerFn({ method: "POST" })
  .validator(adminSignInSchema)
  .handler(async ({ data }) => {
    const { ensureAdminAccount } = await import("@/lib/admin-auth.server");
    return ensureAdminAccount(data.username, data.password);
  });

export const validateAdminSession = createServerFn({ method: "POST" })
  .validator(tokenOnly)
  .handler(async ({ data }) => {
    const { createServerSupabaseClient } = await import("@/integrations/supabase/server-client");
    const { assertAdminUser } = await import("@/lib/admin-auth.server");
    const supabase = createServerSupabaseClient(data.token);
    await assertAdminUser(supabase);
    return { valid: true as const, username: process.env.ADMIN_USERNAME ?? "admin" };
  });
