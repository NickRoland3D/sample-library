# Deployment Guide

This guide covers setting up the external services and deploying the Roland Rotary Sample Gallery.

## Prerequisites

Before deployment, you'll need accounts for:
- [Supabase](https://supabase.com) (free tier works)
- [Vercel](https://vercel.com) (free tier works)
- [Remove.bg](https://www.remove.bg/api) (optional, for auto background removal)
- [Microsoft Azure](https://portal.azure.com) (optional, for OneDrive integration)

---

## 1. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click **New Project**
3. Enter project details:
   - Name: `roland-sample-gallery`
   - Database Password: (save this somewhere safe)
   - Region: Choose closest to your users

### Run Database Schema

1. Go to **SQL Editor** in the Supabase dashboard
2. Copy contents of `supabase/schema.sql` from this repo
3. Paste and click **Run**

This creates:
- `profiles` table (user profiles)
- `product_types` table (categories)
- `samples` table (main data)
- RLS policies for security
- Triggers for timestamps

### Create Storage Bucket

1. Go to **Storage** in the dashboard
2. Click **New Bucket**
3. Name: `thumbnails`
4. Toggle **Public bucket** ON
5. Click **Create bucket**

### Get API Keys

1. Go to **Settings** → **API**
2. Copy and save:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## 2. Remove.bg Setup (Optional)

The Remove.bg API enables automatic background removal for uploaded images.

### Get API Key

1. Go to [remove.bg/api](https://www.remove.bg/api)
2. Create an account / sign in
3. Go to API section
4. Copy your API key → `REMOVE_BG_API_KEY`

### Pricing Notes

- **Free tier**: 50 images/month
- The app detects white backgrounds and skips Remove.bg for those images
- Without a key, background removal is skipped (normalization still works)

---

## 3. Microsoft Azure Setup (Optional)

For OneDrive integration (storing design files).

### Register Azure App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Enter details:
   - Name: `Roland Sample Gallery`
   - Supported account types: Single tenant (or multi if needed)
   - Redirect URI: Leave blank
5. Click **Register**

### Get Credentials

After registration, note down:
- **Application (client) ID** → `MICROSOFT_CLIENT_ID`
- **Directory (tenant) ID** → `MICROSOFT_TENANT_ID`

### Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Enter description and expiry
4. Copy the **Value** immediately → `MICROSOFT_CLIENT_SECRET`
   - (You won't be able to see it again!)

### Add API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions**
5. Add: `Files.ReadWrite.All`
6. Click **Grant admin consent**

---

## 4. Environment Variables

Create a `.env.local` file with all variables:

```env
# ============================================
# REQUIRED - Supabase
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# OPTIONAL - Remove.bg (background removal)
# ============================================
# Get key at: https://www.remove.bg/api
# Free tier: 50 images/month
REMOVE_BG_API_KEY=your_api_key_here

# ============================================
# OPTIONAL - Microsoft Azure (OneDrive)
# ============================================
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_FOLDER_PATH=/SampleLibrary

# ============================================
# APP CONFIG
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Vercel Deployment

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import the `sample-library` repository
4. Vercel will auto-detect Next.js

### Configure Environment Variables

1. Before deploying, expand **Environment Variables**
2. Add each variable from your `.env.local`:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... | All |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... | All |
| `REMOVE_BG_API_KEY` | your_key | All |
| `NEXT_PUBLIC_APP_URL` | https://your-domain.vercel.app | All |

3. Click **Deploy**

### Custom Domain (Optional)

1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS as instructed

Current production URL: `rolandrotarysamples.vercel.app`

---

## 6. Post-Deployment Checklist

After deployment, verify:

- [ ] Login page loads with animated background (if samples exist)
- [ ] Registration rejects non-Roland email domains
- [ ] Can create a new sample with image upload
- [ ] Image is automatically processed (check for consistent padding)
- [ ] Can search and filter samples
- [ ] Hashtag search works (search `#tagname`)
- [ ] Can edit and delete own samples
- [ ] OneDrive links open correctly (if configured)

---

## Environment-Specific Configurations

### Development
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_APP_URL=https://rolandrotarysamples.vercel.app
```

---

## Updating Deployment

### Automatic (Recommended)

Push to `main` branch → Vercel auto-deploys

```bash
git push origin main
```

### Manual

In Vercel dashboard:
1. Go to project → **Deployments**
2. Click **Redeploy** on latest deployment

---

## Monitoring

### Vercel

- **Functions**: View API route logs
- **Analytics**: (Pro plan) Usage statistics
- **Logs**: Real-time function logs

### Supabase

- **Table Editor**: View/edit data
- **Logs**: API and auth logs
- **Usage**: Database and storage usage

---

## Rollback

If a deployment causes issues:

1. Go to Vercel → **Deployments**
2. Find the last working deployment
3. Click **...** → **Promote to Production**

---

## Security Notes

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Rotate secrets** if exposed
3. **Service role key** grants full DB access - only use server-side
4. **Supabase RLS** provides row-level security even if API is exposed

---

## Cost Estimates

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| Supabase | 500MB DB, 1GB storage | Well within limits |
| Vercel | 100GB bandwidth | Well within limits |
| Remove.bg | 50 images/month | May need paid plan |
| Azure | Minimal | OneDrive API is free |

---

## Troubleshooting Deployment

### Build Fails

```bash
# Test build locally first
npm run build
```

Common issues:
- TypeScript errors (run `npx tsc --noEmit`)
- Missing environment variables
- Import errors

### Images Not Loading

1. Verify `thumbnails` bucket is public in Supabase
2. Check `next.config.js` has correct image domains:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
    },
  ],
},
```

### Auth Not Working

1. Verify Supabase URL and anon key are correct
2. Check Site URL in Supabase Auth settings matches deployment URL
3. Verify email templates in Supabase if using email confirmation

### Background Removal Not Working

1. Check `REMOVE_BG_API_KEY` is set in Vercel
2. Verify you haven't exceeded API limits
3. Check Vercel function logs for errors
