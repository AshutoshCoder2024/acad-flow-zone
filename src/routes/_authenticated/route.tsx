import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthGate,
});

function AuthGate() {
  const { user, profile, loading, isEnvAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !isEnvAdmin) navigate({ to: "/auth", replace: true });
  }, [loading, user, isEnvAdmin, navigate]);

  useEffect(() => {
    if (loading || isEnvAdmin || !user || !profile) return;
    if (profile.verification_status === "pending" || profile.verification_status === "rejected") {
      supabase.auth.signOut().then(() => navigate({ to: "/auth", replace: true }));
    }
  }, [loading, user, profile, isEnvAdmin, navigate]);

  if (loading || (!user && !isEnvAdmin)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <Outlet />;
}
