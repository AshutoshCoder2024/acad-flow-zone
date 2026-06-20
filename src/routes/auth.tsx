import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { rollToEmail, type AppRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — DeptPortal" }] }),
  component: AuthPage,
});

const signinStudentSchema = z.object({
  roll: z.string().trim().min(2, "Roll number required").max(40),
  password: z.string().min(6, "Min 6 characters").max(128),
});

const signinStaffSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const signupSchema = z.object({
  role: z.enum(["student", "teacher", "admin"]),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional(),
  roll: z.string().trim().min(2).max(40).optional(),
  department: z.string().trim().max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  password: z.string().min(6).max(128),
});

function AuthPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold">DeptPortal</span>
        </Link>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-display">Welcome</CardTitle>
            <CardDescription>Sign in or create your department account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <SignInForm
                  onDone={async () => {
                    await refresh();
                    navigate({ to: "/dashboard" });
                  }}
                />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm
                  onDone={async () => {
                    await refresh();
                    navigate({ to: "/dashboard" });
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"student" | "staff">("student");
  const [loading, setLoading] = useState(false);

  async function handleStudent(form: FormData) {
    const parsed = signinStudentSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: rollToEmail(parsed.data.roll),
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    onDone();
  }

  async function handleStaff(form: FormData) {
    const parsed = signinStaffSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    onDone();
  }

  return (
    <div className="mt-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="staff">Teacher / Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="student" className="mt-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleStudent(new FormData(e.currentTarget));
            }}
          >
            <Field name="roll" label="Roll number" placeholder="e.g. 22CS101" />
            <Field name="password" label="Password" type="password" />
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleStaff(new FormData(e.currentTarget));
            }}
          >
            <Field name="email" label="Email" type="email" placeholder="you@school.edu" />
            <Field name="password" label="Password" type="password" />
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const [role, setRole] = useState<AppRole>("student");
  const [loading, setLoading] = useState(false);

  async function handle(form: FormData) {
    const raw = Object.fromEntries(form);
    const parsed = signupSchema.safeParse({ ...raw, role });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const d = parsed.data;
    const email = role === "student" ? rollToEmail(d.roll!) : d.email!;
    if (role === "student" && !d.roll) return toast.error("Roll number required");
    if (role !== "student" && !d.email) return toast.error("Email required");

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: d.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          role,
          full_name: d.full_name,
          roll_number: d.roll ?? null,
          department: d.department ?? null,
          semester: d.semester ?? null,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    onDone();
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handle(new FormData(e.currentTarget));
      }}
    >
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field name="full_name" label="Full name" placeholder="Jane Doe" />
      {role === "student" ? (
        <>
          <Field name="roll" label="Roll number" placeholder="22CS101" />
          <div className="grid grid-cols-2 gap-3">
            <Field name="department" label="Department" placeholder="CSE" />
            <Field name="semester" label="Semester" type="number" placeholder="5" />
          </div>
        </>
      ) : (
        <>
          <Field name="email" label="Email" type="email" placeholder="you@school.edu" />
          <Field name="department" label="Department" placeholder="CSE" />
        </>
      )}
      <Field name="password" label="Password" type="password" placeholder="Min 6 chars" />
      <Button className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By signing up you agree to your department's acceptable-use policy.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} autoComplete="off" />
    </div>
  );
}
