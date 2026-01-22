# Roland Rotary Sample Gallery

A professional internal web application for Roland DG employees to manage and browse rotary printing sample images. Features visual gallery browsing, search with hashtag support, automatic image processing, and OneDrive integration for design files.

**Live URL:** https://rolandrotarysamples.vercel.app

## Quick Start for Developers

```bash
# Clone and install
git clone https://github.com/NickRoland3D/sample-library.git
cd sample-library
npm install

# Set up environment (copy and fill in values)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

- **Visual Gallery** - Masonry grid layout with thumbnail previews
- **Search & Filter** - Search by name, notes, or hashtags (e.g., `#glossy`)
- **Hashtag Support** - Add tags like `#wine-red #2024` in notes for easy categorization
- **Auto Image Processing** - Automatic background removal + whitespace normalization
- **Email Domain Restriction** - Registration limited to Roland email domains
- **Animated Login Page** - Dynamic background using actual gallery images
- **OneDrive Integration** - Links to design files stored in OneDrive
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (thumbnails) |
| Image Processing | Sharp (normalization) + Remove.bg API (background removal) |
| Design Files | Microsoft OneDrive |
| Deployment | Vercel |

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, data flow, and component structure |
| [DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Development workflow, coding standards, testing |
| [API.md](./docs/API.md) | API endpoint documentation |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment and environment setup |

## Project Structure

```
sample-library/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── samples/       # CRUD for samples
│   │   │   ├── product-types/ # Product type management
│   │   │   └── admin/         # Admin endpoints
│   │   ├── admin/             # Admin pages
│   │   ├── login/             # Auth pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main gallery page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI primitives
│   │   └── *.tsx             # Feature components
│   ├── lib/                   # Utility libraries
│   │   ├── supabase/         # Supabase client setup
│   │   ├── microsoft/        # OneDrive integration
│   │   ├── imageProcessing.ts # Image processing pipeline
│   │   └── hashtags.ts       # Hashtag utilities
│   └── types/                 # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema
├── public/                    # Static assets
│   ├── rolandhybrid.svg      # Roland logo (white)
│   └── roland.svg            # Roland logo (color)
├── docs/                      # Documentation
└── .env.example              # Environment template
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Remove.bg API (Optional - for auto background removal)
REMOVE_BG_API_KEY=your_api_key

# Microsoft Azure (Optional - for OneDrive)
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_FOLDER_PATH=/SampleLibrary

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Features Explained

### Hashtag System
Users can add hashtags in sample notes (e.g., `Beautiful glossy finish #wine #red #glossy`).
- Hashtags are displayed as styled badges in the detail view
- Search supports hashtag filtering: type `#glossy` to find all samples with that tag
- Supports alphanumeric tags with hyphens: `#wine-red`, `#2024-collection`

### Image Processing Pipeline
When uploading images, the system automatically:
1. **Checks for white background** - Samples corners/edges (85% white threshold)
2. **Removes background if needed** - Uses Remove.bg API (skipped if already white to save credits)
3. **Normalizes whitespace** - Trims edges, adds consistent 10% padding, makes square

### Email Domain Restriction
Registration is restricted to Roland email domains:
- `@rolanddg.co.jp`
- `@rolanddga.com`
- `@rolanddg.com`

## Common Tasks

### Add a New Product Type
1. Go to Supabase Dashboard → Table Editor → `product_types`
2. Insert new row with `name` field

Or via SQL:
```sql
INSERT INTO product_types (name) VALUES ('New Type Name');
```

### Reprocess Existing Images
Visit `/admin/reprocess` to trigger reprocessing of all existing sample images through the image processing pipeline.

### Add a New Field to Samples
1. Update schema in Supabase (add column)
2. Update `src/types/database.ts`
3. Update relevant components and API routes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" errors | Check Supabase keys, verify user is logged in |
| Images not loading | Verify `thumbnails` bucket is public in Supabase |
| Background removal not working | Check `REMOVE_BG_API_KEY` is set in Vercel |
| Login background blank | No samples in database yet (it uses actual gallery images) |

## Contributing

1. Create a feature branch from `main`
2. Make changes with clear commit messages
3. Run `npm run build` to verify no errors
4. Push and create a PR

## License

Internal Roland DG project - Not for public distribution
