# Development Guide

This guide covers the development workflow, coding standards, and common tasks for working on the Roland Rotary Sample Gallery.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NickRoland3D/sample-library.git
cd sample-library
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env.local
```

Fill in the values (see [DEPLOYMENT.md](./DEPLOYMENT.md) for details on obtaining keys).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check without emitting |

## Development Workflow

### Branch Strategy

```
main (production)
  │
  └── feature/your-feature-name
```

1. Create feature branch from `main`
2. Make changes with clear commits
3. Push and create PR
4. Merge after review

### Commit Messages

Follow conventional commits:

```
feat: add hashtag support to search
fix: resolve image upload error on Safari
docs: update API documentation
refactor: simplify image processing logic
style: format with prettier
```

### Before Committing

Always run:

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build
```

## Code Organization

### Adding a New Page

1. Create folder in `src/app/` with `page.tsx`:

```typescript
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page Content</div>
}
```

2. For protected pages, check auth in the page component:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Protected Content</div>
}
```

### Adding a New API Route

1. Create route file in `src/app/api/`:

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'success' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests
}
```

### Adding a New Component

1. Create component in `src/components/`:

```typescript
// src/components/MyComponent.tsx
'use client' // Only if using hooks/interactivity

import { useState } from 'react'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [isActive, setIsActive] = useState(false)

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button
        onClick={() => {
          setIsActive(!isActive)
          onAction?.()
        }}
        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded"
      >
        {isActive ? 'Active' : 'Inactive'}
      </button>
    </div>
  )
}
```

### Adding a New Database Field

1. **Update Supabase schema** (via SQL Editor in dashboard):

```sql
ALTER TABLE samples ADD COLUMN new_field TEXT;
```

2. **Update TypeScript types** (`src/types/database.ts`):

```typescript
samples: {
  Row: {
    // ... existing fields
    new_field: string | null
  }
  Insert: {
    // ... existing fields
    new_field?: string | null
  }
  Update: {
    // ... existing fields
    new_field?: string | null
  }
}
```

3. **Update relevant components and API routes** to use the new field.

## Styling Guidelines

### Tailwind CSS

We use Tailwind CSS for styling. Key conventions:

```typescript
// Good: Use Tailwind utilities
<div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">

// Avoid: Inline styles
<div style={{ padding: '16px', backgroundColor: 'white' }}>
```

### Color Palette

Primary colors are defined in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    50: '#fdf4f3',   // Lightest
    100: '#fce8e6',
    // ...
    600: '#c92519',  // Main brand color (Roland red)
    700: '#a91f15',
    // ...
    950: '#4a0c07',  // Darkest
  }
}
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  p-4           // Base (mobile)
  md:p-6        // Medium screens
  lg:p-8        // Large screens
">
```

## Working with Supabase

### Client-Side (Browser)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Query data
const { data, error } = await supabase
  .from('samples')
  .select('*')
  .order('created_at', { ascending: false })
```

### Server-Side (API Routes)

```typescript
import { createClient } from '@supabase/supabase-js'

// Use service role for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Auth Verification in API Routes

```typescript
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // User is authenticated, proceed...
}
```

## Working with Images

### Image Processing Pipeline

The `src/lib/imageProcessing.ts` module handles:

1. **White background detection** - Checks if image already has white background
2. **Background removal** - Uses Remove.bg API if needed
3. **Normalization** - Trims whitespace, adds padding, makes square

```typescript
import { processImage } from '@/lib/imageProcessing'

const rawBuffer = Buffer.from(await file.arrayBuffer())
const { buffer: processedBuffer, wasBackgroundRemoved } = await processImage(rawBuffer)
```

### Testing Image Processing Locally

If you don't have a Remove.bg API key:
- Background removal will be skipped (warning logged)
- Normalization (trim + padding) will still work

## Debugging

### Console Logging

API routes log to the terminal where `npm run dev` is running.

```typescript
console.log('Processing image...')
console.log(`White background: ${isWhiteBackground}`)
console.error('Upload failed:', error)
```

### Supabase Dashboard

- View data: Table Editor
- Run queries: SQL Editor
- Check logs: Logs section
- Monitor storage: Storage section

### Vercel Logs

For production debugging:
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select project → Functions tab
3. View real-time logs

## Common Issues

### "Module not found" after adding new file

```bash
# Restart dev server
npm run dev
```

### TypeScript errors after schema change

```bash
# Regenerate types (if using Supabase CLI)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Or manually update `src/types/database.ts`.

### Supabase connection issues

Check environment variables:
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Image upload fails

1. Check `thumbnails` bucket exists in Supabase Storage
2. Verify bucket is public or has proper policies
3. Check file size limits (default: 50MB)

## Testing

Currently using manual testing. To add automated tests:

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

Recommended test structure:
```
src/
├── components/
│   ├── MyComponent.tsx
│   └── __tests__/
│       └── MyComponent.test.tsx
```

## Performance Tips

1. **Use Server Components** where possible (no `'use client'`)
2. **Lazy load images**: `<img loading="lazy" />`
3. **Minimize client-side state**: Keep state close to where it's used
4. **Avoid unnecessary re-renders**: Memoize expensive computations

## Getting Help

- Check existing docs in `/docs`
- Review similar code in the codebase
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Tailwind docs: https://tailwindcss.com/docs
