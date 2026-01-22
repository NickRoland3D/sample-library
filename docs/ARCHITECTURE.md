# Architecture Overview

This document describes the system architecture, data flow, and key design decisions for the Roland Rotary Sample Gallery.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Login Page │  │ Gallery Page│  │Detail Modal │  │ Add Modal   │    │
│  │  /login     │  │     /       │  │             │  │             │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                                    │                                    │
│                         Supabase Client (Browser)                       │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                          ┌──────────┴──────────┐
                          │   Next.js API       │
                          │   Routes            │
                          │  /api/samples/*     │
                          │  /api/product-types │
                          │  /api/admin/*       │
                          └──────────┬──────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   Supabase    │          │   Supabase    │          │   External    │
│   Database    │          │   Storage     │          │   Services    │
│  (PostgreSQL) │          │  (thumbnails) │          │               │
│               │          │               │          │  • Remove.bg  │
│  • samples    │          │               │          │  • OneDrive   │
│  • profiles   │          │               │          │               │
│  • product_   │          │               │          │               │
│    types      │          │               │          │               │
└───────────────┘          └───────────────┘          └───────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User → Login Page → Supabase Auth → JWT Token → Middleware validates → Protected routes
```

The authentication is handled by Supabase Auth:
- **Login**: `supabase.auth.signInWithPassword()`
- **Registration**: `supabase.auth.signUp()` with email domain validation
- **Session**: Stored in cookies, validated by middleware on each request
- **Domain Restriction**: Enforced client-side in `/src/app/login/page.tsx`

Allowed domains (defined in `login/page.tsx`):
```typescript
const ALLOWED_DOMAINS = ['rolanddg.co.jp', 'rolanddga.com', 'rolanddg.com']
```

### 2. Sample Upload Flow

```
User selects image
       │
       ▼
┌──────────────────┐
│  Browser Form    │
│  (AddSampleModal)│
└────────┬─────────┘
         │ FormData (image + metadata)
         ▼
┌──────────────────┐
│  POST /api/      │
│  samples         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Image Processing│────▶│  hasWhiteBackground│
│  Pipeline        │     │  (check corners)   │
└────────┬─────────┘     └──────────────────┘
         │                        │
         │            ┌───────────┴───────────┐
         │            │  > 85% white?         │
         │            └───────────┬───────────┘
         │                   No   │   Yes
         │            ┌───────────┴───────────┐
         │            ▼                       ▼
         │   ┌────────────────┐    ┌────────────────┐
         │   │ Remove.bg API  │    │ Skip removal   │
         │   │ (background    │    │ (save credits) │
         │   │  removal)      │    │                │
         │   └───────┬────────┘    └───────┬────────┘
         │           └────────────┬────────┘
         │                        ▼
         │            ┌──────────────────┐
         │            │ normalizeWhitespace│
         │            │ (Sharp: trim,     │
         │            │  pad, square)     │
         │            └─────────┬────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Supabase        │   │  Supabase DB     │
│  Storage Upload  │──▶│  Insert Record   │
│  (thumbnails)    │   │  (samples table) │
└──────────────────┘   └──────────────────┘
```

### 3. Gallery View Flow

```
User visits / (main page)
         │
         ▼
┌──────────────────┐
│  page.tsx        │
│  Server Component│
└────────┬─────────┘
         │ Auth check
         ▼
┌──────────────────┐
│  Redirect to     │──── (if not authenticated)
│  /login          │
└────────┬─────────┘
         │ (authenticated)
         ▼
┌──────────────────┐
│  Fetch samples   │
│  from Supabase   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Client-side     │
│  - Filter by type│
│  - Search (text) │
│  - Search (#tags)│
│  - Sort          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  MasonryGrid     │
│  (renders cards) │
└──────────────────┘
```

## Component Architecture

### Page Components

| Component | Path | Purpose |
|-----------|------|---------|
| `page.tsx` | `/` | Main gallery page with search/filter |
| `login/page.tsx` | `/login` | Authentication with animated background |
| `admin/reprocess/page.tsx` | `/admin/reprocess` | Admin image reprocessing |

### Feature Components

| Component | Purpose |
|-----------|---------|
| `MasonryGrid` | Responsive grid layout for sample cards |
| `SampleCard` | Individual sample thumbnail with hover effects |
| `SampleDetailModal` | Full sample view with edit capability |
| `AddSampleModal` | Form for uploading new samples |
| `FilterBar` | Search input + product type dropdown |
| `TopBar` | Header with user info and logout |
| `ManageProductTypesModal` | CRUD for product categories |

### UI Components (`/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button` | Styled button with loading states |
| `Input` | Form input with label and helper text |
| `Select` | Dropdown select component |
| `Modal` | Reusable modal wrapper |

## Database Schema

### Tables

```sql
profiles
├── id (UUID, PK, FK → auth.users)
├── email (TEXT)
├── full_name (TEXT, nullable)
├── avatar_url (TEXT, nullable)
└── created_at (TIMESTAMPTZ)

product_types
├── id (UUID, PK)
├── name (TEXT, unique)
├── icon (TEXT, nullable)
└── created_at (TIMESTAMPTZ)

samples
├── id (UUID, PK)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
├── name (TEXT)
├── product_type (TEXT)
├── thumbnail_url (TEXT)
├── onedrive_folder_url (TEXT)
├── onedrive_folder_id (TEXT)
├── notes (TEXT, nullable)  ← Supports #hashtags
├── uploaded_by (UUID, FK → profiles)
├── print_time_minutes (INT, nullable)
├── ink_usage_ml (INT, nullable)
└── difficulty (ENUM, nullable)
```

### Row Level Security (RLS)

All tables have RLS enabled:
- **profiles**: Anyone can view, users can update own
- **product_types**: Anyone can view, authenticated can create
- **samples**: Anyone can view, authenticated can create, owner can update/delete

## Key Design Decisions

### 1. Why Next.js App Router?

- Server Components for initial data loading (better SEO, faster initial load)
- API Routes in the same codebase (simplicity)
- Middleware for auth protection
- Easy Vercel deployment

### 2. Why Supabase?

- PostgreSQL with RLS (row-level security out of the box)
- Built-in auth with magic links / password
- Storage bucket for images
- Real-time capabilities (if needed later)
- Generous free tier

### 3. Why Sharp + Remove.bg?

- **Sharp**: Fast, server-side image manipulation (trim, resize, padding)
- **Remove.bg**: High-quality background removal when needed
- **Smart Detection**: Skips Remove.bg if background is already white (85% threshold) to save API credits

### 4. Why Client-Side Filtering?

For a sample gallery of this size (hundreds to low thousands):
- Instant filtering without network requests
- Better UX (no loading states for filter changes)
- Simpler implementation
- Server-side would be beneficial if dataset grows significantly

### 5. Hashtag Implementation

Hashtags are stored as plain text within the `notes` field (not a separate table):
- Simpler schema
- No joins required
- Extracted at runtime via regex: `/#[\w-]+/g`
- Trade-off: Can't easily query "all unique tags" or do tag analytics

## File Organization Principles

```
src/
├── app/              # Routes (pages + API)
│   ├── api/         # Backend logic
│   └── */page.tsx   # Frontend pages
├── components/       # React components
│   ├── ui/          # Generic, reusable
│   └── *.tsx        # Feature-specific
├── lib/              # Utilities & configs
│   ├── supabase/    # Database client
│   └── *.ts         # Utility functions
└── types/            # TypeScript definitions
```

## Security Considerations

1. **Authentication**: All protected routes require valid Supabase session
2. **Authorization**: RLS policies enforce data access rules at DB level
3. **Domain Restriction**: Email domain validation prevents unauthorized registration
4. **API Keys**: Stored in environment variables, never exposed to client
5. **Service Role**: Only used in API routes (server-side), never client-side

## Performance Considerations

1. **Image Optimization**: Sharp normalizes images to consistent sizes
2. **Lazy Loading**: Gallery images use `loading="lazy"`
3. **Client Filtering**: Avoids network round-trips for search
4. **Vercel Edge**: Static assets served from edge CDN
5. **Supabase CDN**: Storage bucket serves images from nearest PoP
