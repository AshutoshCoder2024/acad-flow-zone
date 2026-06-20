import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, VerificationStatus } from "@/lib/auth-helpers";
import { highestRole } from "@/lib/auth-helpers";
import {
  clearAdminSession,
  getAdminSession,
  saveAdminSession,
  type AdminSession,
} from "@/lib/admin-session";
import { validateAdminSession } from "@/functions/admin-auth.functions";

type Profile = {
  id: string;
  email: string;
  full_name: string;
  roll_number: string | null;
  department: string | null;
  semester: number | null;
  avatar_url: string | null;
  verification_status: VerificationStatus;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  role: AppRole;
  isEnvAdmin: boolean;
  adminToken: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setEnvAdminSession: (session: AdminSession) => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

const ENV_ADMIN_PROFILE: Profile = {
  id: "env-admin",
  email: "admin@local",
  full_name: "Administrator",
  roll_number: null,
  department: null,
  semester: null,
  avatar_url: null,
  verification_status: "not_applicable",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isEnvAdmin, setIsEnvAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadFor(u: User | null) {
    if (!u) {
      if (!getAdminSession()) {
        setProfile(null);
        setRoles([]);
      }
      return;
    }
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
    ]);
    setProfile(prof ?? null);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
  }

  async function loadEnvAdmin(): Promise<boolean> {
    const stored = getAdminSession();
    if (!stored) {
      setIsEnvAdmin(false);
      setAdminToken(null);
      return false;
    }

    try {
      await validateAdminSession({ data: { token: stored.token } });
      setIsEnvAdmin(true);
      setAdminToken(stored.token);
      setProfile(ENV_ADMIN_PROFILE);
      setRoles(["admin"]);
      return true;
    } catch {
      clearAdminSession();
      setIsEnvAdmin(false);
      setAdminToken(null);
      return false;
    }
  }

  async function refresh() {
    const envOk = await loadEnvAdmin();
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    if (data.session?.user) {
      await loadFor(data.session.user);
    } else if (envOk) {
      setProfile(ENV_ADMIN_PROFILE);
      setRoles(["admin"]);
    } else if (!envOk) {
      setProfile(null);
      setRoles([]);
    }
  }

  function setEnvAdminSession(adminSession: AdminSession) {
    saveAdminSession(adminSession);
    setIsEnvAdmin(true);
    setAdminToken(adminSession.token);
    setProfile(ENV_ADMIN_PROFILE);
    setRoles(["admin"]);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setTimeout(async () => {
        const envOk = await loadEnvAdmin();
        if (sess?.user) {
          await loadFor(sess.user);
        } else if (envOk) {
          setProfile(ENV_ADMIN_PROFILE);
          setRoles(["admin"]);
        } else if (!envOk) {
          setProfile(null);
          setRoles([]);
        }
      }, 0);
    });
    refresh().finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const role: AppRole = isEnvAdmin ? "admin" : highestRole(roles);

  async function signOut() {
    clearAdminSession();
    setIsEnvAdmin(false);
    setAdminToken(null);
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  }

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        profile,
        roles,
        role,
        isEnvAdmin,
        adminToken,
        loading,
        refresh,
        signOut,
        setEnvAdminSession,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
