# ScanPlay

ScanPlay is a dedicated, distraction-free video hosting and viewing platform built for event invitations, wedding stationery, and direct link distribution.

## Core Flow

```text
UPLOAD VIDEO → CREATE VIDEO PAGE → GET URL → COPY URL
```

The user receives a clean, permanent public URL (e.g., `https://scanplay.io/v/8Kx92Lm`). That link can be shared directly via message or pasted into any external QR-code generator for printed media.

> **Note:** ScanPlay hosts and delivers the video; external QR code generators produce physical QR prints. ScanPlay contains no QR-generation dependencies or functionality.

## Project Phases

- [x] **Phase 1: Project Foundation + Landing Page** (Complete)
- [x] **Phase 2: Supabase Foundation** (Complete, Private Storage Bucket)
- [x] **Phase 3: Admin Auth + Dashboard + Video Upload Workflow** (Complete)
- [x] **Phase 4: Public Video Playback (`/v/[id]`)** (Complete)
- [x] **Phase 5: URL Management & Lifecycle Hardening** (Complete)
- [x] **Phase 6: Responsive Polish + Accessibility + UX Hardening** (Complete)
- [x] **Phase 7: Final Production Testing + Deployment Preparation** (Complete)

## Tech Stack

- Next.js 16 (App Router with Proxy)
- React 19
- TypeScript 5
- Tailwind CSS 4
- `@supabase/ssr` & `@supabase/supabase-js`
- `nanoid` (for short public ID generation)
- `lucide-react` (essential icons only)

## Routes

- **Landing Page:** `/`
- **Admin Login:** `/admin/login` (email/password with Supabase Auth)
- **Admin Dashboard:** `/admin` (protected server route with video upload, listing, copy-link, and deletion)
- **Public Video Viewer:** `/v/[id]` (guest video viewing using time-limited signed URLs from private storage)

## Supabase Setup Instructions

1. **Create Supabase Project:**
   Create a new project at [supabase.com](https://supabase.com).

2. **Execute Database & Storage Migration:**
   - In Supabase Dashboard, navigate to the **SQL Editor**.
   - Paste and run the contents of [`supabase/schema.sql`](file:///C:/Users/JAY%20PATEL/Documents/Jay/ScanPlay/supabase/schema.sql).
   - This sets up the `videos` table, RLS policies, the private `videos` storage bucket, and bucket access policies.

3. **Create Admin User:**
   - In Supabase Dashboard, navigate to **Authentication** -> **Users**.
   - Click **Add User** -> **Create User**.
   - Enter your admin email and password. Use these credentials to sign in at `/admin/login`.

4. **Local Configuration:**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

## Vercel Deployment Instructions

1. **Push Code to Git Repository:**
   Push this project to your GitHub, GitLab, or Bitbucket repository.

2. **Import Project in Vercel:**
   - Log in to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
   - Select your repository.
   - Framework Preset will be automatically detected as **Next.js**.

3. **Configure Environment Variables in Vercel:**
   Under **Environment Variables**, add the following four keys:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://xyz.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your public anon key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your secret service role key (marked Sensitive).
   - `NEXT_PUBLIC_SITE_URL`: Your production Vercel domain (e.g., `https://your-app.vercel.app`).

4. **Deploy:**
   - Click **Deploy**. Vercel will execute `npm run build` and launch the application.

## Verification Commands

```bash
npm run typecheck
npm run lint
npm run build
```
