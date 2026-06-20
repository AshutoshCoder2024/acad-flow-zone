import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminSignInSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(128),
});

const adminTokenSchema = z.object({
  token: z.string().min(1),
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator(adminSignInSchema)
  .handler(async ({ data }) => {
    const { loginAdmin } = await import("@/lib/admin-auth.server");
    return loginAdmin(data.username, data.password);
  });

export const validateAdminSession = createServerFn({ method: "POST" })
  .validator(adminTokenSchema)
  .handler(async ({ data }) => {
    const { verifyAdminToken } = await import("@/lib/admin-auth.server");
    const { username } = verifyAdminToken(data.token);
    return { valid: true as const, username };
  });
