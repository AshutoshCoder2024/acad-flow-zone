import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { GraduationCap, Megaphone, BookOpen, Calendar, ClipboardCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Department Management Portal" },
      { name: "description", content: "A modern hub for notices, resources, events, and attendance — built for students, teachers and admins." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">DeptPortal</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent" />
            One portal for your entire department
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
            The <span className="gradient-text">Department</span><br /> runs on one portal.
          </h1>
          <p className="mt-6 text-base text-muted-foreground md:text-lg">
            Notices, study materials, past-year papers, events, and attendance — built for students, teachers, and admins.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth" search={{ mode: "signup" } as never}>Create account</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Megaphone, title: "Notices", text: "Pinned by priority, attachments, instant updates." },
            { icon: BookOpen, title: "Resources", text: "Notes, PYQs and lab manuals — filterable by semester and subject." },
            { icon: Calendar, title: "Events", text: "Upcoming and past events with galleries and registration links." },
            { icon: ClipboardCheck, title: "Attendance", text: "Teachers mark, students track percentages in real time." },
          ].map((f) => (
            <div
              key={f.title}
              className="surface-glow rounded-xl border border-border p-5 transition-transform hover:-translate-y-0.5"
            >
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
