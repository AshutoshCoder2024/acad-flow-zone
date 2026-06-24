import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { rollToEmail, type AppRole } from "@/lib/auth-helpers";
import { useAuth } from "@/hooks/use-auth";
import { adminLogin } from "@/functions/admin-auth.functions";
import { registerAccount } from "@/functions/register.functions";

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

const signinTeacherSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const signinAdminSchema = z.object({
  username: z.string().trim().min(1, "Username required").max(100),
  password: z.string().min(1, "Password required").max(128),
});

const signupSchema = z.object({
  role: z.enum(["student", "teacher"]),
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional(),
  roll: z.string().trim().min(2).max(40).optional(),
  department: z.string().trim().min(1, "Department required").max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  password: z.string().min(6).max(128),
});

async function blockUnverifiedTeacher(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.verification_status === "pending") {
    await supabase.auth.signOut();
    toast.error("Your account is pending administrator approval.");
    return true;
  }

  if (profile?.verification_status === "rejected") {
    await supabase.auth.signOut();
    toast.error("Your registration request was rejected. Contact your administrator.");
    return true;
  }

  return false;
}

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
                  onAdminDone={async () => {
                    await refresh();
                    navigate({ to: "/admin" });
                  }}
                />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SignInForm({
  onDone,
  onAdminDone,
}: {
  onDone: () => void | Promise<void>;
  onAdminDone: () => void | Promise<void>;
}) {
  const { setEnvAdminSession } = useAuth();
  const [mode, setMode] = useState<"student" | "teacher" | "admin">("student");
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

  async function handleTeacher(form: FormData) {
    const parsed = signinTeacherSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (data.user && (await blockUnverifiedTeacher(data.user.id))) {
      setLoading(false);
      return;
    }
    setLoading(false);
    toast.success("Signed in");
    onDone();
  }

  async function handleAdmin(form: FormData) {
    const parsed = signinAdminSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.signOut();
      const response = await adminLogin({ data: parsed.data });
      setEnvAdminSession({
        token: response.token,
        username: response.username,
        expiresAt: response.expiresAt,
      });
      toast.success("Signed in as administrator");
      await onAdminDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Administrator sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
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
        <TabsContent value="teacher" className="mt-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleTeacher(new FormData(e.currentTarget));
            }}
          >
            <Field name="email" label="Email" type="email" placeholder="you@school.edu" />
            <Field name="password" label="Password" type="password" />
            <p className="text-xs text-muted-foreground">
              Only verified teachers can sign in. New registrations require administrator approval.
            </p>
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="admin" className="mt-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleAdmin(new FormData(e.currentTarget));
            }}
          >
            <Field name="username" label="Username" placeholder="admin" autoComplete="username" />
            <Field name="password" label="Password" type="password" autoComplete="current-password" />
            <p className="text-xs text-muted-foreground">
              Sign in with the administrator username and password from your server .env file.
            </p>
            <Button className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in as administrator
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignUpForm() {
  const [role, setRole] = useState<AppRole>("student");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handle(form: FormData) {
    const raw = Object.fromEntries(form);
    const parsed = signupSchema.safeParse({ ...raw, role: role === "teacher" ? "teacher" : "student" });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const d = parsed.data;
    const signupRole = d.role;
    if (signupRole === "student" && !d.roll) return toast.error("Roll number required");
    if (signupRole === "teacher" && !d.email) return toast.error("Email required");
    if (signupRole === "teacher" && !d.department) return toast.error("Department required");

    setLoading(true);
    try {
      await registerAccount({
        data: {
          role: signupRole,
          full_name: d.full_name,
          email: d.email,
          roll: d.roll,
          department: d.department,
          semester: d.semester,
          password: d.password,
        },
      });
    } catch (err) {
      setLoading(false);
      return toast.error(err instanceof Error ? err.message : "Registration failed");
    }
    setLoading(false);

    if (signupRole === "teacher") {
      setSubmitted(true);
      toast.success("Registration submitted for review");
      return;
    }

    toast.success("Account created — you can sign in now");
    setSubmitted(true);
  }

  if (submitted && role === "teacher") {
    return (
      <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4 text-sm">
        <p className="font-medium">Registration submitted</p>
        <p className="text-muted-foreground">
          Your teacher account is pending administrator approval. You will be able to sign in once
          your request has been reviewed.
        </p>
        <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (submitted && role === "student") {
    return (
      <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-4 text-sm">
        <p className="font-medium">Account created</p>
        <p className="text-muted-foreground">You can now sign in with your roll number and password.</p>
        <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
          Go to sign in
        </Button>
      </div>
    );
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
          <Field name="department" label="Department" placeholder="CSE" required />
          <p className="text-xs text-muted-foreground">
            Teacher accounts require administrator approval before you can sign in.
          </p>
        </>
      )}
      <Field name="password" label="Password" type="password" placeholder="Min 6 chars" />
      <Button className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {role === "teacher" ? "Submit registration" : "Create account"}
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
  autoComplete,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        required={required}
      />
    </div>
  );
}
