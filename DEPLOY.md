# Deploy DeptPortal to Vercel

Step-by-step guide to deploy this project (TanStack Start + Supabase) on [Vercel](https://vercel.com).

---

## What you are deploying

| Layer | Technology |
|-------|------------|
| Frontend + server | TanStack Start (React), built with **Nitro** for Vercel |
| Database & auth | **Supabase** (students/teachers sign in here) |
| Admin login | Username/password from **Vercel env vars** (not Supabase) |
| Attendance API | Server functions proxy to `sxcran.ac.in` |

You need **two accounts**:

1. [Supabase](https://supabase.com) — database, student/teacher auth  
2. [Vercel](https://vercel.com) — hosts the website  

---

## Part 1 — Prepare Supabase (one time)

### 1.1 Create or open your Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project (or **New project** → pick name, password, region → **Create**)
3. Wait until the project status is **Active**

### 1.2 Run database migrations

Your schema lives in `supabase/migrations/`. Apply it to Supabase:

**Option A — Supabase CLI (recommended)**

```bash
# Install CLI: https://supabase.com/docs/guides/cli
npm install -g supabase

# Login
supabase login

# Link project (Project ID is in Supabase → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

**Option B — Supabase Dashboard**

1. **SQL Editor** → **New query**
2. Open each file under `supabase/migrations/` **in order** (oldest date first)
3. Paste contents → **Run**

Migration files (run in this order):

1. `20260620091143_*.sql` — core tables  
2. `20260620091206_*.sql` — function grants  
3. `20260620091252_*.sql` — storage policies  
4. `20260621120000_teacher_verification.sql` — teacher approval  
5. `20260621130000_claim_first_admin.sql` — admin bootstrap (legacy)  
6. `20260621140000_ensure_admin_role.sql` — admin role helper (legacy)  

### 1.3 Collect Supabase API keys

1. Supabase Dashboard → **Project Settings** (gear) → **API**
2. Copy and save:

| Label in dashboard | Use as env var |
|--------------------|----------------|
| **Project URL** | `SUPABASE_URL` and `VITE_SUPABASE_URL` |
| **Project ID** | `SUPABASE_PROJECT_ID` and `VITE_SUPABASE_PROJECT_ID` |
| **anon / public** key | `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` |

> **Note:** The admin panel now uses a server-side administrator session and authenticated admin user flow. `SUPABASE_SERVICE_ROLE_KEY` is no longer required for standard admin panel operations.

---

## Part 2 — Prepare the code for Vercel

### 2.1 Enable Nitro in Vite (required)

This repo uses `@lovable.dev/vite-tanstack-config`. For Vercel, **Nitro must be enabled** so server routes and server functions work.

In `vite.config.ts` you should have:

```ts
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset: "vercel" },  // ← required for Vercel
});
```

If `nitro` is missing or uses `cloudflare-module`, Vercel deploy will fail or return 404.

### 2.2 Verify build locally

```bash
npm install
npm run build
```

Build should finish without errors. You should **not** see:

`skipping nitro deploy plugin`

If you still see that message, `nitro: true` is not applied correctly.

### 2.3 Push code to GitHub

Vercel deploys from Git.

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

Use your default branch name (`main` or `master`) in Vercel later.

---

## Part 3 — Create Vercel project

### 3.1 Import repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → choose **GitHub** (authorize if asked)
3. Select repository: `acad-flow-zone` (or your fork)
4. Click **Import**

### 3.2 Configure project (Build & Development Settings)

On the **Configure Project** screen, set:

| Field | What to enter |
|-------|----------------|
| **Project Name** | e.g. `deptportal` (becomes `deptportal.vercel.app`) |
| **Framework Preset** | **TanStack Start** (if missing, pick it manually or use Other + settings below) |
| **Root Directory** | `./` (leave default unless app is in a subfolder) |
| **Build Command** | `npm run build` |
| **Output Directory** | Leave **empty** / default (Nitro sets `.vercel/output` automatically) |
| **Install Command** | `npm install` |

Do **not** deploy yet — add environment variables first (Part 4).

---

## Part 4 — Environment variables on Vercel

Before the first deploy, open **Environment Variables** (still on configure screen, or later: **Project → Settings → Environment Variables**).

Add **every** row below. For each variable, enable **Production**, **Preview**, and **Development** unless noted.

### 4.1 Supabase — client (browser-safe)

These are bundled into the frontend. Values come from Supabase → Settings → API.

| Name | Example value | Where to fill |
|------|---------------|---------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Vercel → Env Variables → **Key** = name, **Value** = Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` (anon key) | Same — use **anon public** key |
| `VITE_SUPABASE_PROJECT_ID` | `uvoarjvaiepglghbwudn` | Same — Project ID / ref |

### 4.2 Supabase — server (secrets, no VITE_ prefix)

Used by SSR and server functions. Same Supabase API page.

| Name | Example value | Notes |
|------|---------------|--------|
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` | Duplicate without `VITE_` for server code |
| `SUPABASE_PUBLISHABLE_KEY` | Same as anon key | Server-side Supabase client |
| `SUPABASE_PROJECT_ID` | Same project ID | Reference |

### 4.3 Administrator login (server only)

Admin does **not** use Supabase Auth. Credentials are checked on the server against these vars.

| Name | Example value | Notes |
|------|---------------|--------|
| `ADMIN_USERNAME` | `admin` | Username on Admin sign-in tab |
| `ADMIN_PASSWORD` | `YourStrongPassword123!` | Use a strong password; change default before production |

> Never add `ADMIN_PASSWORD` with a `VITE_` prefix.

### 4.4 Quick copy checklist

In Vercel UI, you will create **8 variables**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_PROJECT_ID
ADMIN_USERNAME
ADMIN_PASSWORD
```

**How to add one variable in Vercel:**

1. **Key:** paste name (e.g. `ADMIN_USERNAME`)  
2. **Value:** paste value  
3. Environments: check **Production**, **Preview**, **Development**  
4. Click **Add**  
5. Repeat for all 9  

Then click **Deploy**.

---

## Part 5 — After first deploy

### 5.1 Note your live URL

When the build finishes, Vercel shows something like:

- Production: `https://deptportal.vercel.app`  
- Preview: `https://deptportal-xxxxx.vercel.app`  

Copy the **production** URL.

### 5.2 Configure Supabase Auth URLs

So student/teacher login works on your live site:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL, e.g.  
   `https://deptportal.vercel.app`
3. Under **Redirect URLs**, add:
   ```
   https://deptportal.vercel.app/**
   https://*.vercel.app/**
   ```
   (Second line allows preview deployments.)
4. **Save**

### 5.3 Redeploy (if you changed env vars after first deploy)

**Project → Deployments → … → Redeploy**

Env changes only apply to **new** deployments.

---

## Part 6 — Verify everything works

Open your production URL and test:

| Test | Steps | Expected |
|------|--------|----------|
| Home page | Open `/` | Landing page loads |
| Student signup | `/auth` → Create account → Student | Account created, can sign in |
| Teacher signup | Create account → Teacher | “Pending approval” message |
| Admin login | `/auth` → Admin tab → env username/password | Redirects to `/admin` |
| Approve teacher | Admin panel → Teacher requests → Approve | Teacher can sign in |
| Attendance | Sign in as student → Attendance | Roll number + fetch (needs valid SXC roll) |

### Admin login reminder

- Tab: **Sign in → Admin**  
- Username: value of `ADMIN_USERNAME` on Vercel  
- Password: value of `ADMIN_PASSWORD` on Vercel  
- No Supabase user is created for admin  

### Admin panel empty or error?

- Confirm `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set correctly  
- Sign in again after updating env vars  
- Check server function errors if the admin session does not validate  

---

## Part 7 — Optional: deploy with Vercel CLI

```bash
npm install -g vercel
vercel login
cd acad-flow-zone
vercel          # preview deployment
vercel --prod   # production
```

Pull env vars to local `.env` for testing:

```bash
vercel env pull .env.local
```

---

## Part 8 — Custom domain (optional)

1. Vercel → **Project → Settings → Domains**
2. Add domain (e.g. `portal.yourcollege.edu`)
3. Add DNS records at your registrar (Vercel shows exact records)
4. Update Supabase **Site URL** and **Redirect URLs** to the new domain
5. Redeploy

---

## Troubleshooting

### Build fails on Vercel

- Run `npm run build` locally and fix errors first  
- **Settings → General → Node.js Version** → set **20.x** or **22.x**  
- Check build logs for missing env vars  

### Site loads but routes return 404

- Ensure `nitro: { preset: "vercel" }` is in `vite.config.ts`  
- Framework preset = **TanStack Start**  
- Do not set Output Directory to `dist` manually  

### “Missing Supabase environment variable(s)”

- Add both `VITE_*` and non-`VITE_` Supabase vars  
- Redeploy after adding them  

### Admin login: “Invalid administrator credentials”

- `ADMIN_USERNAME` / `ADMIN_PASSWORD` on Vercel must match exactly what you type  
- No extra spaces in Vercel values  
- Redeploy after changing admin env vars  

### Admin panel: session validation error

- Confirm `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set correctly  
- No Supabase user is created for admin  
- Check server function errors if the admin session does not validate  

### Student login works locally but not on Vercel

- Update Supabase **Site URL** and **Redirect URLs** (Part 5.2)  
- Use the exact production URL  

### Teacher stays “pending” after approve

- Confirm migrations ran (`verification_status` column exists)  
- Check admin panel network tab for server function errors  
- Ensure the admin session is valid and the user role was updated correctly  

### Attendance returns empty data

- Server proxy calls `sxcran.ac.in`; roll number and semester must be valid  
- College portal may block some server IPs — if it fails only on Vercel, contact college IT or use a different proxy  

---

## Security checklist before going live

- [ ] Change `ADMIN_PASSWORD` from default to a strong unique password  
- [ ] Do not commit `.env` (keep secrets in Vercel only)  
- [ ] Supabase RLS enabled (migrations already enable this)  
- [ ] Restrict Supabase **Redirect URLs** to your real domains in production  

---

## File reference

| File | Purpose |
|------|---------|
| `vite.config.ts` | `nitro: { preset: "vercel" }` for Vercel |
| `.env` | Local dev only — copy values to Vercel, do not commit secrets |
| `supabase/migrations/` | Database schema — run via `supabase db push` |
| `src/functions/admin-auth.functions.ts` | Env-based admin login |
| `src/functions/admin-api.functions.ts` | Admin panel API (authenticated admin session) |
| `src/functions/attendance.functions.ts` | SXC attendance proxy |

---

## Summary flow

```
1. Supabase: create project → run migrations → copy API keys
2. GitHub: push code (with nitro: true in vite.config.ts)
3. Vercel: import repo → add 9 env vars → Deploy
4. Supabase: set Site URL + Redirect URLs to Vercel URL
5. Test: student, teacher, admin, approve flow, attendance
```

For issues specific to TanStack Start on Vercel, see [Vercel’s TanStack Start guide](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel).
