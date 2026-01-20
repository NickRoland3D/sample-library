# Sample Library

A professional web application for managing design sample files. Browse sample photos, filter by product type, and access design files stored in OneDrive.

![Sample Library Screenshot](docs/screenshot.png)

## Features

- 📷 **Visual Gallery** - Browse samples with thumbnail previews
- 🔍 **Search & Filter** - Find samples by name or product type
- ☁️ **OneDrive Integration** - Design files automatically uploaded to OneDrive
- 👥 **Team Access** - Individual user accounts with authentication
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**:
  - Thumbnails: Supabase Storage
  - Design Files: Microsoft OneDrive (via Graph API)

## Prerequisites

- Node.js 18+
- A Supabase account (free tier works)
- A Microsoft Azure account (for OneDrive integration)

## Setup Guide

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sample-library
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage** and create a bucket called `thumbnails` (make it public)
4. Go to **Settings > API** and copy your:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

### 3. Set Up Microsoft Azure (OneDrive)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory > App registrations**
3. Click **New registration**:
   - Name: "Sample Library"
   - Supported account types: Choose based on your org
   - Redirect URI: Leave blank for now
4. After creation, note down:
   - Application (client) ID
   - Directory (tenant) ID
5. Go to **Certificates & secrets** > **New client secret**
   - Create and copy the secret value immediately
6. Go to **API permissions** > **Add a permission**:
   - Microsoft Graph > Application permissions
   - Add: `Files.ReadWrite.All`
   - Click **Grant admin consent**

### 4. Configure Environment Variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Microsoft Azure
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=your-secret-value
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_FOLDER_PATH=/SampleLibrary

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. Create Your First User

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Click "Sign up" and create an account
3. Check your email for the confirmation link
4. Sign in and start adding samples!

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted with `npm run build && npm start`

## Adding Product Types

Product types are stored in the database. To add new types:

1. Go to your Supabase dashboard
2. Open the **Table Editor**
3. Select the `product_types` table
4. Insert a new row with just the `name` field

Or run SQL:

```sql
INSERT INTO product_types (name) VALUES ('New Type Name');
```

## Project Structure

```
sample-library/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── login/          # Login page
│   │   └── page.tsx        # Main gallery page
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── ...            # Feature components
│   ├── lib/               # Utility libraries
│   │   ├── supabase/      # Supabase client setup
│   │   └── microsoft/     # Microsoft Graph API
│   └── types/             # TypeScript types
├── supabase/
│   └── schema.sql         # Database schema
└── public/                # Static assets
```

## Customization

### Changing the Theme

Edit `tailwind.config.ts` to customize colors:

```ts
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom color palette
        500: '#your-color',
        600: '#your-darker-color',
        // ...
      },
    },
  },
},
```

### Adding New Fields

1. Update the database schema in Supabase
2. Update `src/types/database.ts`
3. Update the relevant components and API routes

## Troubleshooting

### "Unauthorized" errors
- Check that your Supabase keys are correct
- Make sure the user is logged in
- Verify RLS policies are set up correctly

### OneDrive upload fails
- Verify Azure app has `Files.ReadWrite.All` permission
- Check that admin consent was granted
- Verify the client secret hasn't expired

### Images not loading
- Check that the `thumbnails` bucket exists in Supabase
- Verify the bucket is public or has proper policies
- Check the `images.remotePatterns` in `next.config.js`

## License

MIT
