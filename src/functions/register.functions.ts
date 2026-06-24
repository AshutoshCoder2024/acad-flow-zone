import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rollToEmail } from "@/lib/auth-helpers";

const registerSchema = z.object({
  role: z.enum(["student", "teacher"]),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional(),
  roll: z.string().trim().min(2).max(40).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  password: z.string().min(6).max(128),
});

export const registerAccount = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const { createServerSupabaseClient } = await import("@/integrations/supabase/server-client");

    if (data.role === "student" && !data.roll) {
      throw new Error("Roll number required");
    }
    if (data.role === "teacher" && !data.email) {
      throw new Error("Email required");
    }
    if (data.role === "teacher" && !data.department) {
      throw new Error("Department required");
    }

    const email = data.role === "student" ? rollToEmail(data.roll!) : data.email!;
    const supabase = createServerSupabaseClient();

    const { data: created, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          role: data.role,
          full_name: data.full_name,
          roll_number: data.roll ?? null,
          department: data.department ?? null,
          semester: data.semester ?? null,
        },
      },
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        throw new Error("An account with this email or roll number already exists.");
      }
      throw new Error(error.message);
    }

    if (!created.user) {
      throw new Error("Registration failed. Please try again.");
    }

    return { role: data.role, userId: created.user.id };
  });
