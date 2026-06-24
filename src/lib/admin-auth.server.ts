import { createServerSupabaseClient } from "@/integrations/supabase/server-client";
import type { Session } from "@supabase/supabase-js";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? `${ADMIN_USERNAME ?? "admin"}@local`;

function adminEnvMissing(): string | null {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return "Administrator login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.";
  }
  return null;
}

export async function ensureAdminAccount(username: string, password: string): Promise<{ session: Session; username: string }> {
  const configError = adminEnvMissing();
  if (configError) throw new Error(configError);

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw new Error("Invalid administrator credentials.");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD!,
  });

  if (!error && data.session) {
    return { session: data.session, username };
  }

  if (error && /invalid login credentials|wrong password|user not found|has not yet been confirmed/i.test(error.message)) {
    const signUpResult = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD!,
      options: {
        data: {
          role: "admin",
          bootstrap_admin: true,
          full_name: "Administrator",
        },
      },
    });

    if (signUpResult.error) {
      throw new Error(signUpResult.error.message);
    }
    if (!signUpResult.data?.session) {
      throw new Error("Administrator account created, but no session was returned. Check Supabase email confirmation settings.");
    }

    return { session: signUpResult.data.session, username };
  }

  throw new Error(error?.message ?? "Failed to sign in administrator.");
}
