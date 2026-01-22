# Claude Code Handoff - Roland Rotary Sample Gallery

## Project Overview

This is an internal web application for Roland DG employees to manage and browse rotary printing sample images. It's a Next.js 14 app with Supabase backend, deployed on Vercel.

**Live URL:** https://rolandrotarysamples.vercel.app
**Repository:** https://github.com/NickRoland3D/sample-library

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** Supabase Auth (email/password, restricted to Roland domains)
- **Storage:** Supabase Storage (thumbnails bucket)
- **Image Processing:** Sharp (normalization) + Remove.bg API (background removal)
- **Deployment:** Vercel (auto-deploys from main branch)

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── samples/          # CRUD endpoints for samples
│   │   │   ├── route.ts      # GET all, POST new
│   │   │   └── [id]/route.ts # GET, PATCH, DELETE by ID
│   │   ├── product-types/    # Product category endpoints
│   │   └── admin/            # Admin endpoints
│   │       └── reprocess-images/route.ts
│   ├── admin/reprocess/      # Admin page for image reprocessing
│   ├── login/page.tsx        # Auth page with animated background
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main gallery page
├── components/               # React components
│   ├── ui/                   # Reusable primitives (Button, Input, Modal, Select)
│   ├── AddSampleModal.tsx    # Upload new sample form
│   ├── SampleDetailModal.tsx # View/edit sample details
│   ├── SampleCard.tsx        # Gallery thumbnail card
│   ├── MasonryGrid.tsx       # Responsive grid layout
│   ├── FilterBar.tsx         # Search + type filter
│   └── TopBar.tsx            # Header with user info
├── lib/                      # Utilities
│   ├── supabase/             # Supabase client setup (client.ts, server.ts, middleware.ts)
│   ├── imageProcessing.ts    # Remove.bg + Sharp pipeline
│   ├── hashtags.ts           # Hashtag extraction utilities
│   └── microsoft/graph.ts    # OneDrive integration
└── types/database.ts         # TypeScript types for Supabase tables
```

## Key Features Implemented

1. **Visual Gallery** - Masonry grid with thumbnails, click to view details
2. **Search & Filter** - By name, notes, hashtags (#tag), or product type
3. **Hashtag System** - Add #tags in notes field, searchable, displayed as badges
4. **Auto Image Processing** - On upload: detect white bg → Remove.bg if needed → normalize whitespace
5. **Email Domain Restriction** - Only @rolanddg.co.jp, @rolanddga.com, @rolanddg.com can register
6. **Animated Login** - Background uses actual gallery thumbnails
7. **Admin Reprocess** - /admin/reprocess page to reprocess all existing images

## Database Schema (Supabase)

```sql
samples (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  onedrive_folder_url TEXT NOT NULL,
  onedrive_folder_id TEXT NOT NULL,
  notes TEXT,  -- Supports #hashtags
  uploaded_by UUID REFERENCES profiles(id),
  print_time_minutes INT,
  ink_usage_ml INT,
  difficulty ENUM('Easy', 'Medium', 'Hard'),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

product_types (id, name, icon, created_at)
profiles (id, email, full_name, avatar_url, created_at)
```

## Environment Variables

Required in `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxwzxjfhjhgybjnkgdvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
REMOVE_BG_API_KEY=<remove_bg_key>  # Optional but configured
NEXT_PUBLIC_APP_URL=https://rolandrotarysamples.vercel.app
```

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npx tsc --noEmit     # Type check
git push origin main # Deploy (auto-deploys via Vercel)
```

## Important Files to Know

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main gallery with search/filter logic |
| `src/app/login/page.tsx` | Auth + domain restriction + animated bg |
| `src/lib/imageProcessing.ts` | Image pipeline (white detection, Remove.bg, Sharp) |
| `src/lib/hashtags.ts` | extractHashtags(), parseTextWithHashtags() |
| `src/components/SampleDetailModal.tsx` | View/edit sample with hashtag badges |
| `src/components/AddSampleModal.tsx` | Upload form |
| `src/app/api/samples/route.ts` | POST handler with image processing |

## Documentation

Detailed docs are in the `/docs` folder:
- `ARCHITECTURE.md` - System design, data flow diagrams
- `DEVELOPMENT.md` - Dev workflow, adding features
- `API.md` - API endpoint documentation
- `DEPLOYMENT.md` - Setup guides for all services

## Recent Changes

1. Renamed Vercel subdomain to `rolandrotarysamples.vercel.app`
2. Added Roland branding to login page with animated gallery background
3. Implemented image processing pipeline (Remove.bg + Sharp whitespace normalization)
4. Added hashtag support in notes field with search filtering
5. Created comprehensive documentation

## Common Tasks

**Add a new field to samples:**
1. Add column in Supabase SQL Editor
2. Update `src/types/database.ts`
3. Update relevant components and API routes

**Add a new product type:**
```sql
INSERT INTO product_types (name) VALUES ('New Type');
```

**Reprocess all images:**
Visit `/admin/reprocess` and click the button

## Notes for Development

- Always run `npx tsc --noEmit` before committing
- The login page background only shows if there are samples in the database
- Remove.bg is skipped if image corners are >85% white (saves API credits)
- Sharp normalizes images to squares with 10% padding on all sides
- RLS policies mean users can only edit/delete their own samples
