Us

A private relationship operating system for exactly one couple. Agreements, daily rhythm, weekly reflections, goals, conflict archive, and future plans — warm, calm, and fully self-contained.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (auth + Postgres + RLS) · Vercel-ready

---

## What you need from me / from you

This app needs a **brand-new** Supabase project (do not reuse an existing one) and stays **local-only** until you ask for GitHub / Vercel.

Fill `.env.local` with the project URL, publishable/anon key, and service role key.

To apply migrations from the CLI (instead of the SQL editor), also provide either:

- `DATABASE_URL` — Settings → Database → URI, then `npm run db:migrate`
- or `SUPABASE_ACCESS_TOKEN` — [Account → Access Tokens](https://supabase.com/dashboard/account/tokens), then `npm run db:migrate`

Then run `npm run seed`. For a private demo, disable **Confirm email** under Authentication → Providers → Email.

---

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in the three Supabase values
```

### Apply migrations

In the Supabase SQL editor, run each file in `supabase/migrations/` **in order**:

1. `0001_foundation.sql`
2. `0002_constitution.sql`
3. `0003_daily_rhythm.sql`
4. `0004_weekly_reflection.sql`
5. `0005_goals.sql`
6. `0006_conflicts.sql`
7. `0007_future.sql`
8. `0008_realtime_and_lockdown.sql`
9. `0009_trip_activities.sql`
10. `0010_product_guards.sql`

Or with the Supabase CLI linked to your new project:

```bash
supabase db push
```

### Seed demo data

```bash
npm run seed
```

Demo logins (also printed by the seed script):

| Person | Email | Password |
|--------|-------|----------|
| Ilaria | `ilaria@demo.us` | `demo-demo-12` |
| Alen   | `alen@demo.us`   | `demo-demo-12` |

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Product map

| Area | Route | Notes |
|------|-------|-------|
| Home | `/` | Today's rhythm, reflection nudge, review banner, celebration |
| Constitution | `/constitution` | Editable only during setup or 30-day review window |
| Daily rhythm | `/rhythm` | Free-text busy blocks; today only |
| Weekly reflection | `/reflection` | Hidden until both submit; Mon/Tue late window |
| Goals | `/goals` | Mine / yours / ours + cheers |
| Conflict archive | `/conflicts` | After-the-fact repairs only |
| Future | `/future` | Date jar, trips, milestones |
| Settings | `/settings` | Name, invite code, timezone note |

Timezone is always **Europe/Ljubljana**. Weeks start **Monday**. Weekly reflection is prompted on **Sunday**.

All UI copy lives in one file: [`src/lib/copy.ts`](src/lib/copy.ts).

---

## Auth & pairing

- Email/password via Supabase Auth
- Create a couple space → get an invite code, or join with a code
- Exactly **two** users per couple (enforced in the database)
- RLS: you only ever see your own couple's rows
- You can finish onboarding and use the app alone while waiting for your partner

---

## Deploy (when you're ready)

1. Push to a **new private** GitHub repo (say the word and I'll help)
2. Import the repo in Vercel
3. Set the same three env vars
4. Deploy

Confirm email can stay disabled for the private demo project in Supabase Auth settings if you want instant sign-in.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Demo users + sample data |
| `npm run lint` | ESLint |
