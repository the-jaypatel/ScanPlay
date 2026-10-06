<div align="center">

# SCANPLAY

### Upload once. Share anywhere.

A premium, distraction-free video hosting and viewing experience tailored for event invitations, celebrations, and effortless guest playback.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.7-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-20232a?style=flat-square&logo=react&logoColor=61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage_%26_Auth-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![WebCodecs](https://img.shields.io/badge/WebCodecs-Hardware_Accelerated-ff6b6b?style=flat-square)](https://w3c.github.io/webcodecs/)

<br />

[**Explore Live Deployment**](https://scan-play-drab.vercel.app/) &nbsp;•&nbsp; [**Watch Interactive Demo**](https://scan-play-drab.vercel.app/v/demo) &nbsp;•&nbsp; [**Admin Portal**](https://scan-play-drab.vercel.app/admin)

</div>

---

## What is ScanPlay?

Traditional video platforms are built for engagement algorithms, recommendations, ads, and comment sections. When sending out an invitation video for a wedding, milestone anniversary, or private gathering, you don't want your guests distracted by autoplaying feeds or required to install an app.

**ScanPlay is purpose-built for invitation and event video delivery.** 

Hosts upload a video once, receive a permanent shareable link with an automatic QR code, and print or message it anywhere. When guests open the link or scan the QR code with their phone camera, they are greeted by an elegant, distraction-free player that plays their video immediately.

> **Key Distinction:** ScanPlay is a **complete video hosting and playback platform**, not merely a QR-code utility. QR codes serve as the bridge connecting physical invitations to ScanPlay's dedicated viewing experience.

---

## The Experience

```
ADMIN EXPERIENCE                                  GUEST EXPERIENCE
┌────────────────────────┐                        ┌────────────────────────┐
│  Secure Admin Login    │                        │  Scan QR / Tap Link    │
└───────────┬────────────┘                        └───────────┬────────────┘
            │                                                 │
┌───────────▼────────────┐                        ┌───────────▼────────────┐
│  Upload Video File     │                        │  Instant Guest Page    │
│  (≤ 50 MB / WebCodecs) │                        │  (/v/[id])             │
└───────────┬────────────┘                        └───────────┬────────────┘
            │                                                 │
┌───────────▼────────────┐                        ┌───────────▼────────────┐
│  Private Supabase      │                        │  Distraction-Free      │
│  Storage + Signed URL  │                        │  Fullscreen Playback   │
└───────────┬────────────┘                        │  (Audio-First, No Ads) │
            │                                     └────────────────────────┘
┌───────────▼────────────┐
│  Shareable URL & QR    │
│  (Copy Link / Save PNG)│
└────────────────────────┘
```

---

## How It Works

```text
UPLOAD VIDEO ──▶ OPTIMIZE / COMPRESS ──▶ GENERATE LINK ──▶ SHARE QR / LINK ──▶ GUEST WATCHES
```

1. **Upload:** The host uploads an event video through the protected Admin Dashboard.
2. **Optimize:** Files at or below 50 MB bypass compression and upload directly. Oversized videos (> 50 MB) are compressed locally inside the browser via WebCodecs off-thread Web Workers with 3 selectable tiers.
3. **Publish:** The video is safely stored in a private Supabase Storage bucket, and a short 8-character public ID is generated.
4. **Share:** The host copies the canonical video link or downloads a high-contrast QR code PNG ready for printed stationery.
5. **Watch:** Guests open the URL or scan the QR code to watch the video in a dedicated, mobile-optimized player.

---

## Interactive Product Demo

ScanPlay includes a self-contained, reproducible **18-second product explainer demo** directly within the repository at [`public/demo.mp4`](file:///c:/Users/JAY%20PATEL/Documents/Jay/ScanPlay/public/demo.mp4), accessible live at [`/v/demo`](file:///c:/Users/JAY%20PATEL/Documents/Jay/ScanPlay/src/app/v/[id]/page.tsx).

The demo was generated programmatically (Node.js + WebCodecs hardware encoder + HTML5 Canvas compositor + synthesized harmonic audio) to visually showcase the ScanPlay product journey:

| Timestamp | Storyboard Scene | Product Functionality Highlighted |
| :--- | :--- | :--- |
| **0.0s – 3.0s** | **Uploading Video** | Admin file picker selecting `wedding-invitation.mp4` with active upload progress. |
| **3.0s – 6.0s** | **Video Preparation** | Verified badges: *Optimizing stream*, *WebCodecs H.264 ready*, *Fast guest streaming*. |
| **6.0s – 9.0s** | **Dedicated Guest Page** | Elegant player mockup showcasing an invitation (*Aarav & Ananya • Dec 18, 2026*). |
| **9.0s – 12.0s** | **Shareable Guest Link** | Canonical guest URL (`/v/8Kx92Lm`) with interactive *Copy Link* $\rightarrow$ *Copied!* feedback. |
| **12.0s – 15.0s** | **Built-in QR Code** | High-contrast QR card with dynamic laser scanner and camera detection banner. |
| **15.0s – 18.0s** | **Effortless Guest Viewing** | 3-step guest journey (*Scan $\rightarrow$ Open $\rightarrow$ Watch*) and brand lockup. |

- **Asset specs:** 18.0s duration, 1920×1080 resolution (1080p), 30 fps, H.264 AVC, stereo AAC audio, 3.37 MB.
- **Interactive Component:** Featured on the homepage via `PublicDemoCard.tsx`, providing inline video playback, dynamic QR generation, link copying, and direct full-screen testing.

---

## Core Features

### 🎬 Dedicated Guest Video Viewer (`/v/[id]`)
- **Distraction-Free:** No recommended videos, sidebars, comments, or external branding.
- **Audio-First Autoplay:** Attempts autoplay with audio enabled. If the visitor's mobile browser blocks unmuted autoplay, an elegant **"PLAY WITH SOUND"** overlay appears—never silently degrading to muted video.
- **Adaptive Aspect Ratios:** Handles landscape, square, and vertical portrait smartphone videos naturally.

### ⚡ Client-Side WebCodecs Video Compression
- **Zero Server Costs:** Heavy transcoding happens directly on the client machine using native hardware acceleration.
- **Web Worker Architecture:** Heavy decoding, filtering, and multiplexing run off the main thread, keeping the user interface completely fluid.
- **Three Selectable Tiers:** Choose between *Basic* (1080p), *Medium* (720p), and *Strong* (480p) to fit videos under the 50 MB upload threshold.
- **Audio Preservation:** Demuxes and preserves source AAC audio tracks without re-compression degradation.

### 📱 Built-in QR Sharing & Export
- **Dynamic QR Generation:** Generated instantly in-browser using error correction level `M`.
- **High-Resolution PNG Download:** One-click "Save PNG" downloads a crisp 512×512 image for print-ready wedding invitations and cards.
- **Direct Link Copying:** Instant clipboard copy with responsive visual confirmation.

### 🔒 Enterprise-Grade Security & Privacy
- **Private Storage Bucket:** Supabase Storage bucket is strictly non-public; videos cannot be downloaded via direct storage URLs.
- **Time-Limited Signed URLs:** Viewers receive ephemeral signed URLs generated server-side (1-hour validity) strictly after validating that the video is published.
- **Row Level Security (RLS):** Video records are protected at the database layer; admins can only manage their own uploads.
- **Server-Only Service Role:** Administrative Supabase tokens are isolated to server code and never leaked to the client bundle.

---

## Client-Side Video Compression

ScanPlay enforces a **50 MB application upload limit**. Videos at or below 50 MB bypass compression and upload immediately. For oversized videos (> 50 MB), ScanPlay provides an in-browser compression pipeline:

```text
[Input Video > 50 MB]
         │
         ▼
[Dedicated Web Worker] ──▶ MP4Box Demuxing ──▶ VideoDecoder ──▶ VideoEncoder (H.264) ──▶ mp4-muxer
         │                                              ▲
         │                                              │ Hardware Acceleration
         ▼                                              │
[Three Configurable Tiers]                              ▼
  • Basic  (≤ 1080p, Target ~44 MB) ─────────────▶ [Validated Output ≤ 50 MB]
  • Medium (≤ 720p,  Target ~38 MB)                     │
  • Strong (≤ 480p,  Target ~30 MB)                     ▼
                                            [Host Reviews & Uploads]
```

### Compression Tiers

| Tier | Resolution Ceiling | Bitrate Factor | Target Budget | Ideal For |
| :--- | :--- | :--- | :--- | :--- |
| **Basic** | Up to 1080p (1920×1080) | 1.00× | ~44 MB | 4K or 1080p source files slightly above 50 MB seeking maximum fidelity. |
| **Medium** | Up to 720p (1280×720) | 0.72× | ~38 MB | Large files needing a balanced reduction with crisp mobile viewing. |
| **Strong** | Up to 480p (854×480) | 0.50× | ~30 MB | Very large source files needing aggressive compression to comfortably fit. |

### Audio Compatibility & Safety Rules
- **AAC Audio:** In-browser MP4Box extraction and `mp4-muxer` preserve standard AAC (`mp4a`) audio tracks bit-for-bit.
- **Incompatible Audio Guard:** Videos with unsupported audio codecs (e.g., AC-3, Dolby Digital) are detected upfront with a clear advisory message to prevent silent outputs.
- **Silent Videos Supported:** Videos with no audio tracks compress smoothly and produce valid MP4 streams.
- **User Control:** The original oversized video is **never automatically uploaded**. The user reviews the compressed file size and chooses whether to proceed.

---

## Supported Video Formats

ScanPlay accepts standard video files matching `video/*` MIME types and common extensions:

- `.mp4`
- `.webm`
- `.mov`
- `.mkv`
- `.ogv`
- `.m4v`

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (Turbopack)](https://nextjs.org/) | App Router, Server Components, and Server Actions |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type safety across the entire application |
| **UI Library** | [React 19](https://react.dev/) | Client components, hooks, and responsive view logic |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern dark-mode palette and responsive utilities |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icons |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL database, RLS policies, and Admin Auth |
| **Storage** | [Supabase Storage](https://supabase.com/storage) | Private storage bucket with server-signed playback URLs |
| **Video Demuxing** | [MP4Box.js](https://github.com/gpac/mp4box.js) | In-browser ISO BMFF / MP4 container parsing |
| **Video Encoding** | [WebCodecs API](https://w3c.github.io/webcodecs/) | Hardware-accelerated client-side H.264 video encoding |
| **Off-Thread Concurrency** | [Dedicated Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) | Non-blocking compression execution |
| **Muxing** | [mp4-muxer](https://github.com/Kagami/mp4-muxer) | Pure TypeScript MP4 container synthesis |
| **Identifiers** | [nanoid](https://github.com/ai/nanoid) | Collision-resistant 8-character public video IDs |
| **QR Generation** | [node-qrcode](https://github.com/soldair/node-qrcode) | Canvas and DataURL QR code rendering |

---

## Application Routes

| Route | Access | Description |
| :--- | :--- | :--- |
| `/` | **Public** | Product landing page featuring hero section, workflow explanation, and the interactive demo player. |
| `/v/[id]` | **Public** | Clean, distraction-free guest video player serving published videos via signed URLs. |
| `/v/demo` | **Public** | Canonical demo route showcasing the self-generated product explainer video. |
| `/admin/login` | **Public** | Secure email/password login form for authenticated administrators. |
| `/admin` | **Protected** | Authenticated admin dashboard: video uploads, client-side compression card, video library, and QR export. |

---

## Project Structure

```text
ScanPlay/
├── public/
│   ├── demo.mp4                    # Self-generated 18s product explainer video
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── page.tsx                # Homepage
│   │   ├── layout.tsx              # Root HTML & metadata shell
│   │   ├── admin/
│   │   │   ├── page.tsx            # Protected Admin Dashboard
│   │   │   └── login/page.tsx      # Admin authentication portal
│   │   └── v/
│   │       └── [id]/page.tsx       # Public guest video viewer (/v/[id] & /v/demo)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx      # Video list, upload flow, and management
│   │   │   └── VideoCompressionCard.tsx# Tier selection, progress bars, and stats
│   │   ├── FullscreenVideoViewer.tsx   # Distraction-free guest video player
│   │   ├── Header.tsx                  # Navigation bar
│   │   ├── Hero.tsx                    # Landing hero section
│   │   ├── PublicDemoCard.tsx          # Homepage interactive demo & QR showcase
│   │   └── ThreeStepSection.tsx        # Visual 3-step explainer
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── admin.ts            # Server-only service role client
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # SSR Supabase client
│   │   │   └── videos.ts           # Video queries, signed URL generation, and demo bypass
│   │   ├── urls.ts                 # Canonical URL utilities (NEXT_PUBLIC_SITE_URL)
│   │   ├── videoCompressor.ts      # Main compression facade & worker dispatcher
│   │   ├── videoCompressionCore.ts  # WebCodecs demux, decode, encode, and mux pipeline
│   │   └── videoCompressionClient.ts# Dedicated Web Worker bridge
│   ├── types/
│   │   ├── database.types.ts       # Supabase schema typings
│   │   ├── mp4box.d.ts             # MP4Box type definitions
│   │   └── videoCompression.ts     # Compression tier and worker message types
│   └── workers/
│       └── videoCompression.worker.ts # Off-main-thread WebCodecs worker script
├── supabase/
│   └── schema.sql                  # Database migration, RLS policies, and bucket setup
├── .env.example                    # Environment variable template
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js:** 20.x or higher
- **npm:** 10.x or higher
- A free [Supabase](https://supabase.com) account

### 1. Clone & Install

```bash
git clone https://github.com/the-jaypatel/ScanPlay.git
cd ScanPlay
npm install
```

### 2. Configure Supabase

1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in your Supabase project.
3. Paste and run the complete contents of [`supabase/schema.sql`](file:///c:/Users/JAY%20PATEL/Documents/Jay/ScanPlay/supabase/schema.sql). This sets up:
   - The `videos` metadata table with RLS enabled.
   - The private `videos` storage bucket.
   - Access control policies restricting uploads and modifications to authenticated admins.
4. Navigate to **Authentication $\rightarrow$ Users** and click **Add User** to create your admin login credentials.

### 3. Setup Environment Variables

Copy the example environment template:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your credentials:

```ini
# Supabase Project URL (Public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Key (Public - Browser safe)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Service Role Key (Private - Server-only administrative key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Application Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the homepage and test the interactive demo.

---

## Verification & Quality Assurance

ScanPlay includes strict verification commands ensuring zero type errors, clean linting, and solid build artifacts:

```bash
# Verify TypeScript typings
npm run typecheck

# Check code formatting & Next.js/React lint rules
npm run lint

# Compile optimized production build with Turbopack
npm run build
```

### Manual Verification Checklist
- [x] **Homepage Interactive Demo:** Plays `/demo.mp4` natively with full responsive controls.
- [x] **Full-Screen Viewer (`/v/demo`):** Loads smoothly with direct playback and sound controls.
- [x] **Link Copying:** Copies canonical URL with clipboard feedback.
- [x] **QR Code Generation & Download:** Generates scannable QR code and exports crisp PNG.
- [x] **Mobile Responsiveness:** Tested and verified across desktop, tablet, and mobile layouts.
- [x] **Oversized Compression:** WebCodecs Web Worker compresses oversized videos into $\le 50$ MB targets without UI blocking.

---

## Live Deployment

- **Production URL:** [https://scan-play-drab.vercel.app/](https://scan-play-drab.vercel.app/)
- **Demo Route:** [https://scan-play-drab.vercel.app/v/demo](https://scan-play-drab.vercel.app/v/demo)

*(Note: Live deployment reflects the latest deployed release on Vercel).*

---

<div align="center">

**ScanPlay** — Designed and built with care for meaningful moments.

*Upload once. Share anywhere.*

</div>
