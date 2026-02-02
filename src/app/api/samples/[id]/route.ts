import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processImage } from '@/lib/imageProcessing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET single sample
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: sample, error } = await supabase
      .from('samples')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(sample)
  } catch (error) {
    console.error('Error fetching sample:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sample' },
      { status: 500 }
    )
  }
}

// UPDATE sample
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check content type to determine if it's FormData or JSON
    const contentType = request.headers.get('content-type') || ''

    let name: string | undefined
    let product_type: string | undefined
    let notes: string | undefined
    let print_time_minutes: number | null | undefined
    let ink_usage_ml: number | null | undefined
    let onedrive_folder_url: string | null | undefined
    let samplePhoto: File | null = null
    let galleryImages: File[] = []
    let gallery_image_urls: string[] | undefined
    let newTitleUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with image)
      const formData = await request.formData()
      name = formData.get('name') as string | undefined
      product_type = formData.get('product_type') as string | undefined
      notes = formData.get('notes') as string | undefined

      const printTimeStr = formData.get('print_time_minutes') as string | null
      const inkUsageStr = formData.get('ink_usage_ml') as string | null
      const onedriveUrlStr = formData.get('onedrive_folder_url') as string | null

      print_time_minutes = printTimeStr ? parseFloat(printTimeStr) : null
      ink_usage_ml = inkUsageStr ? parseFloat(inkUsageStr) : null
      onedrive_folder_url = onedriveUrlStr || null

      samplePhoto = formData.get('samplePhoto') as File | null
      galleryImages = formData.getAll('galleryImages') as File[]
      newTitleUrl = formData.get('newTitleUrl') as string | null

      const galleryUrlsJson = formData.get('gallery_image_urls') as string | null
      if (galleryUrlsJson) {
        gallery_image_urls = JSON.parse(galleryUrlsJson)
      }
    } else {
      // Handle JSON
      const body = await request.json()
      name = body.name
      product_type = body.product_type
      notes = body.notes
      print_time_minutes = body.print_time_minutes
      ink_usage_ml = body.ink_usage_ml
      onedrive_folder_url = body.onedrive_folder_url
      gallery_image_urls = body.gallery_image_urls
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (product_type !== undefined) updateData.product_type = product_type
    if (notes !== undefined) updateData.notes = notes
    if (print_time_minutes !== undefined) updateData.print_time_minutes = print_time_minutes
    if (ink_usage_ml !== undefined) updateData.ink_usage_ml = ink_usage_ml
    if (onedrive_folder_url !== undefined) updateData.onedrive_folder_url = onedrive_folder_url

    // Handle title swap to an existing gallery image (no reprocessing needed)
    if (newTitleUrl) {
      updateData.thumbnail_url = newTitleUrl
    }

    // Handle image upload if provided (new file as title)
    if (samplePhoto && samplePhoto.size > 0) {
      // Get the current sample to delete old image
      const { data: currentSample } = await supabase
        .from('samples')
        .select('thumbnail_url')
        .eq('id', id)
        .single()

      // Delete old thumbnail if it exists
      if (currentSample?.thumbnail_url) {
        const oldUrl = new URL(currentSample.thumbnail_url)
        const pathParts = oldUrl.pathname.split('/thumbnails/')
        if (pathParts.length > 1) {
          const storagePath = pathParts[1]
          await supabase.storage.from('thumbnails').remove([storagePath])
        }
      }

      // Process image (background removal if needed + whitespace normalization)
      const rawBuffer = Buffer.from(await samplePhoto.arrayBuffer())
      console.log('Processing updated image...')
      const { buffer: processedBuffer, wasBackgroundRemoved } = await processImage(rawBuffer)
      console.log(`Image processing complete. Background removed: ${wasBackgroundRemoved}`)

      // Upload processed image
      const photoPath = `samples/${user.id}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(photoPath, processedBuffer, {
          contentType: 'image/jpeg',
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(photoPath)

      updateData.thumbnail_url = publicUrl
    }

    // Handle gallery images
    // If gallery_image_urls is provided, it represents the desired final list (for reorder/remove)
    if (gallery_image_urls !== undefined) {
      // Get current gallery URLs and thumbnail to find truly removed ones
      const { data: currentSample } = await supabase
        .from('samples')
        .select('gallery_image_urls, thumbnail_url')
        .eq('id', id)
        .single()

      const currentUrls: string[] = currentSample?.gallery_image_urls || []
      // Don't delete URLs that are being reassigned (e.g. gallery→title or title→gallery)
      const preserveUrls = new Set<string>()
      if (newTitleUrl) preserveUrls.add(newTitleUrl) // gallery image becoming title
      if (currentSample?.thumbnail_url && gallery_image_urls.includes(currentSample.thumbnail_url)) {
        preserveUrls.add(currentSample.thumbnail_url) // old title moving to gallery
      }
      const removedUrls = currentUrls.filter(url => !gallery_image_urls!.includes(url) && !preserveUrls.has(url))

      // Delete removed gallery images from storage
      for (const removedUrl of removedUrls) {
        try {
          const urlObj = new URL(removedUrl)
          const pathParts = urlObj.pathname.split('/thumbnails/')
          if (pathParts.length > 1) {
            await supabase.storage.from('thumbnails').remove([pathParts[1]])
          }
        } catch (e) {
          console.error('Error deleting gallery image:', e)
        }
      }

      updateData.gallery_image_urls = gallery_image_urls
    }

    // Upload new gallery images if provided
    if (galleryImages.length > 0) {
      // Start with current gallery URLs (or the just-set ones)
      let currentGalleryUrls: string[] = (updateData.gallery_image_urls as string[]) || []
      if (!updateData.gallery_image_urls) {
        const { data: currentSample } = await supabase
          .from('samples')
          .select('gallery_image_urls')
          .eq('id', id)
          .single()
        currentGalleryUrls = currentSample?.gallery_image_urls || []
      }

      for (let i = 0; i < galleryImages.length; i++) {
        const galleryFile = galleryImages[i]
        if (!galleryFile || galleryFile.size === 0) continue

        const galleryBuffer = Buffer.from(await galleryFile.arrayBuffer())
        const galleryPath = `samples/${user.id}/gallery/${Date.now()}-${i}.jpg`

        const { error: galleryUploadError } = await supabase.storage
          .from('thumbnails')
          .upload(galleryPath, galleryBuffer, {
            contentType: galleryFile.type || 'image/jpeg',
          })

        if (galleryUploadError) {
          console.error(`Gallery image ${i} upload error:`, galleryUploadError)
          continue
        }

        const { data: { publicUrl: galleryPublicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(galleryPath)

        currentGalleryUrls.push(galleryPublicUrl)
      }

      updateData.gallery_image_urls = currentGalleryUrls
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: sample, error } = await supabase
      .from('samples')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(sample)
  } catch (error) {
    console.error('Error updating sample:', error)
    return NextResponse.json(
      { error: 'Failed to update sample' },
      { status: 500 }
    )
  }
}

// DELETE sample
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the sample first to get the thumbnail path and gallery images
    const { data: sample, error: fetchError } = await supabase
      .from('samples')
      .select('thumbnail_url, gallery_image_urls')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
      }
      throw fetchError
    }

    // Delete the thumbnail from storage if it exists
    if (sample?.thumbnail_url) {
      const url = new URL(sample.thumbnail_url)
      const pathParts = url.pathname.split('/thumbnails/')
      if (pathParts.length > 1) {
        const storagePath = pathParts[1]
        await supabase.storage.from('thumbnails').remove([storagePath])
      }
    }

    // Delete gallery images from storage
    if (sample?.gallery_image_urls?.length) {
      for (const galleryUrl of sample.gallery_image_urls) {
        try {
          const urlObj = new URL(galleryUrl)
          const pathParts = urlObj.pathname.split('/thumbnails/')
          if (pathParts.length > 1) {
            await supabase.storage.from('thumbnails').remove([pathParts[1]])
          }
        } catch (e) {
          console.error('Error deleting gallery image:', e)
        }
      }
    }

    // Delete the sample record
    const { error: deleteError } = await supabase
      .from('samples')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sample:', error)
    return NextResponse.json(
      { error: 'Failed to delete sample' },
      { status: 500 }
    )
  }
}
