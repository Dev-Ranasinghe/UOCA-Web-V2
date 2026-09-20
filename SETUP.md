# CMS Setup — Phase 1

One-time setup to get the admin dashboard running locally. Do this once; future
admins you add later won't need to repeat any of it.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Pick a name, a strong database password (save it — you'll need it for the
   connection strings below), and a region close to your users.
3. Wait for provisioning to finish (~2 minutes).

## 2. Get the database connection strings

Project → **Connect** (top of the dashboard) → **ORMs** tab → Prisma.

- Copy the **Transaction pooler** connection string (port `6543`) into
  `.env.local` as `DATABASE_URL`.
- Copy the **Direct connection** string (port `5432`) into `.env.local` as
  `DIRECT_URL`.
- Replace `[YOUR-PASSWORD]` in both with the database password from step 1.

## 3. Get the API keys

Project Settings → **API**.

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (never expose this
  to the browser — it bypasses Row Level Security)

## 4. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or
   reuse) a project → **APIs & Services → Credentials → Create Credentials →
   OAuth client ID** → Application type: **Web application**.
2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in your Supabase project URL).
3. Copy the generated **Client ID** and **Client Secret**.
4. In Supabase: **Authentication → Providers → Google** → paste the Client ID
   and Secret → Save.
5. In Supabase: **Authentication → URL Configuration** → add
   `http://localhost:3000/auth/callback` to **Redirect URLs** (add your
   production URL's `/auth/callback` too once deployed).

## 5. Create the media Storage bucket

**Storage → New bucket** → name it `media` → make it **Public** (read access;
writes are still restricted by the policy below).

Then **Storage → media → Policies → New policy** → allow `INSERT` for
`authenticated` role only (so only signed-in admins can upload):

```sql
create policy "Authenticated users can upload media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media');
```

## 6. Set the Server Actions encryption key

Generate one value and use it everywhere this app runs (local `.env.local`
and later your production environment):

```bash
openssl rand -base64 32
```

Paste it into `.env.local` as `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.

## 7. Run the database migration

```bash
npx prisma migrate dev --name init
```

This creates every table from `prisma/schema.prisma` in your Supabase
database. Verify with `npx prisma studio`.

## 8. Create your account, then bootstrap yourself as Super Admin

1. Run `npm run dev`, visit `http://localhost:3000/admin/login`, and sign up
   with either Google or email/password. This creates a Supabase identity —
   it does **not** grant dashboard access yet (you'll see "not registered as
   an admin" if you try to continue).
2. If you signed up with email/password and your Supabase project has email
   confirmation enabled, check your inbox and confirm first (or temporarily
   disable confirmation under **Authentication → Providers → Email →
   Confirm email** while testing).
3. In the Supabase dashboard, go to **Authentication → Users** and copy your
   new user's **UID**.
4. Go to **SQL Editor** and run (replace both placeholders with your real
   values):

   ```sql
   insert into "Admin" (id, "authUserId", email, "displayName", role, "isActive", "createdAt", "updatedAt")
   values (
     gen_random_uuid()::text,
     '<paste-your-auth-user-uid>',
     '<your-email@example.com>',
     '<Your Name>',
     'SUPER_ADMIN',
     true,
     now(),
     now()
   );
   ```

5. Go back to `/admin/login` and sign in again — you now land on the
   dashboard as Super Admin.

This SQL step is the only place any admin identity is granted — nothing is
ever hardcoded in the app's source code. Once `/admin/admins` gains a
"create admin" form (a later phase), you won't need to touch SQL again for
future admins.
