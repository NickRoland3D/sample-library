# API Documentation

This document describes all API endpoints available in the Roland Rotary Sample Gallery.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://rolandrotarysamples.vercel.app/api`

## Authentication

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer <supabase_jwt_token>
```

To get a token, use Supabase client:

```typescript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

## Endpoints

---

### Samples

#### GET /api/samples

Fetch all samples ordered by creation date (newest first).

**Authentication**: Not required (public read)

**Response**:
```json
[
  {
    "id": "uuid",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "name": "Wine Bottle Sample",
    "product_type": "Wine Bottle",
    "thumbnail_url": "https://xxx.supabase.co/storage/v1/object/public/thumbnails/...",
    "onedrive_folder_url": "https://onedrive.com/...",
    "onedrive_folder_id": "abc123",
    "notes": "Beautiful glossy finish #wine #red #glossy",
    "uploaded_by": "user-uuid",
    "print_time_minutes": 45,
    "ink_usage_ml": 12,
    "difficulty": "Medium"
  }
]
```

**Error Responses**:
- `500`: Server error

---

#### POST /api/samples

Create a new sample with image upload and automatic processing.

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Sample name |
| `productType` | string | Yes | Product category |
| `notes` | string | No | Notes with optional #hashtags |
| `onedriveFolderUrl` | string | Yes | Link to OneDrive folder |
| `samplePhoto` | File | Yes | Image file (JPEG, PNG, etc.) |
| `printTimeMinutes` | string | No | Print time in minutes |
| `inkUsageMl` | string | No | Ink usage in ml |
| `galleryImages` | File[] | No | Additional angle/detail images |

**Example (JavaScript)**:
```typescript
const formData = new FormData()
formData.append('name', 'Wine Bottle Sample')
formData.append('productType', 'Wine Bottle')
formData.append('notes', 'Glossy finish #wine #red')
formData.append('onedriveFolderUrl', 'https://onedrive.com/...')
formData.append('samplePhoto', imageFile)

const response = await fetch('/api/samples', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
})
```

**Success Response** (`201`):
```json
{
  "id": "new-uuid",
  "name": "Wine Bottle Sample",
  "product_type": "Wine Bottle",
  "thumbnail_url": "https://...",
  "notes": "Glossy finish #wine #red",
  "uploaded_by": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Image Processing**:
The uploaded image is automatically processed:
1. Background detection (checks if already white)
2. Background removal via Remove.bg (if not white)
3. Whitespace normalization (trim + 10% padding + square crop)

**Error Responses**:
- `400`: Missing required fields
- `401`: Unauthorized (missing/invalid token)
- `500`: Server error (upload or processing failed)

---

#### GET /api/samples/[id]

Fetch a single sample by ID.

**Authentication**: Not required

**URL Parameters**:
- `id`: Sample UUID

**Response**:
```json
{
  "id": "uuid",
  "name": "Wine Bottle Sample",
  "product_type": "Wine Bottle",
  "thumbnail_url": "https://...",
  "notes": "Notes here #hashtag",
  "uploaded_by": "user-uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `404`: Sample not found
- `500`: Server error

---

#### PATCH /api/samples/[id]

Update an existing sample.

**Authentication**: Required (must be sample owner)

**Content-Type**: `application/json` or `multipart/form-data` (when uploading images)

**URL Parameters**:
- `id`: Sample UUID

**Request Body** (all fields optional):

JSON body:
```json
{
  "name": "Updated Name",
  "product_type": "Updated Type",
  "notes": "Updated notes #newtag",
  "onedrive_folder_url": "https://new-url.com",
  "gallery_image_urls": ["https://..."]
}
```

FormData body (when uploading new images):
- `samplePhoto` (File, optional): New title image (runs through image processing pipeline)
- `galleryImages` (File[], optional): New additional images to append
- `gallery_image_urls` (JSON string, optional): Current gallery URLs array (for reorder/remove)

**Image Processing**:
When a new `samplePhoto` is uploaded via PATCH, it goes through the same processing pipeline as POST (white detection, background removal, normalization).

**Success Response** (`200`):
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "updated_at": "2024-01-16T10:30:00Z"
}
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Sample not found
- `500`: Server error

---

#### DELETE /api/samples/[id]

Delete a sample.

**Authentication**: Required (must be sample owner)

**URL Parameters**:
- `id`: Sample UUID

**Success Response** (`200`):
```json
{
  "message": "Sample deleted successfully"
}
```

**Error Responses**:
- `401`: Unauthorized
- `403`: Forbidden (not the owner)
- `404`: Sample not found
- `500`: Server error

---

### Product Types

#### GET /api/product-types

Fetch all product types.

**Authentication**: Not required

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Wine Bottle",
    "icon": "wine",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "name": "Spirits Bottle",
    "icon": "bottle",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST /api/product-types

Create a new product type.

**Authentication**: Required

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "name": "New Type",
  "icon": "icon-name"
}
```

**Success Response** (`201`):
```json
{
  "id": "new-uuid",
  "name": "New Type",
  "icon": "icon-name",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400`: Missing name or duplicate
- `401`: Unauthorized
- `500`: Server error

---

### Admin

#### POST /api/admin/reprocess-images

Reprocess all existing sample images through the image processing pipeline.

**Authentication**: Required

**Note**: This endpoint downloads each image, processes it (background removal if needed + normalization), and re-uploads it. Can be slow for large datasets.

**Request Body**: None

**Success Response** (`200`):
```json
{
  "message": "Reprocessing complete",
  "processed": 45,
  "failed": 2,
  "details": [
    { "id": "uuid1", "status": "success" },
    { "id": "uuid2", "status": "failed", "error": "Download timeout" }
  ]
}
```

**Error Responses**:
- `401`: Unauthorized
- `500`: Server error

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Remove.bg API has its own rate limits (50 requests/month on free tier).

## CORS

API routes accept requests from the same origin only (Next.js default). For external API access, CORS headers would need to be added.

## Webhooks

No webhooks are currently implemented.

---

## Client-Side Usage Examples

### Fetch all samples
```typescript
const response = await fetch('/api/samples')
const samples = await response.json()
```

### Create a sample
```typescript
const formData = new FormData()
formData.append('name', 'Sample Name')
formData.append('productType', 'Wine Bottle')
formData.append('onedriveFolderUrl', 'https://...')
formData.append('samplePhoto', file)

const { data: { session } } = await supabase.auth.getSession()

const response = await fetch('/api/samples', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: formData,
})

if (response.ok) {
  const newSample = await response.json()
  console.log('Created:', newSample)
}
```

### Update a sample
```typescript
const response = await fetch(`/api/samples/${sampleId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Name',
    notes: 'New notes #updated',
  }),
})
```

### Delete a sample
```typescript
const response = await fetch(`/api/samples/${sampleId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
```
