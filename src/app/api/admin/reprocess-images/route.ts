import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processImage } from '@/lib/imageProcessing'

// Use service role for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
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

    // Fetch all samples with thumbnail URLs
    const { data: samples, error: fetchError } = await supabase
      .from('samples')
      .select('id, thumbnail_url, uploaded_by')
      .not('thumbnail_url', 'is', null)

    if (fetchError) {
      throw new Error('Failed to fetch samples')
    }

    if (!samples || samples.length === 0) {
      return NextResponse.json({ message: 'No samples to process', processed: 0 })
    }

    console.log(`Starting reprocessing of ${samples.length} images...`)

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const sample of samples) {
      try {
        console.log(`Processing sample ${sample.id}...`)

        // Download the current image
        const imageResponse = await fetch(sample.thumbnail_url)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

        // Process the image (normalize whitespace - skip background removal for existing clean images)
        const { buffer: processedBuffer } = await processImage(imageBuffer)

        // Generate new path for the processed image
        const newPath = `samples/${sample.uploaded_by}/${Date.now()}-reprocessed.jpg`

        // Upload the processed image
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(newPath, processedBuffer, {
            contentType: 'image/jpeg',
          })

        if (uploadError) {
          throw new Error(`Failed to upload: ${uploadError.message}`)
        }

        // Get the new public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('thumbnails').getPublicUrl(newPath)

        // Update the sample record with the new URL
        const { error: updateError } = await supabase
          .from('samples')
          .update({ thumbnail_url: publicUrl })
          .eq('id', sample.id)

        if (updateError) {
          throw new Error(`Failed to update record: ${updateError.message}`)
        }

        // Try to delete the old image (extract path from URL)
        try {
          const oldUrl = new URL(sample.thumbnail_url)
          const oldPath = oldUrl.pathname.split('/thumbnails/')[1]
          if (oldPath) {
            await supabase.storage.from('thumbnails').remove([oldPath])
          }
        } catch {
          // Ignore errors deleting old file
        }

        results.processed++
        console.log(`✓ Sample ${sample.id} processed successfully`)
      } catch (error) {
        results.failed++
        const errorMsg = `Sample ${sample.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMsg)
        console.error(`✗ ${errorMsg}`)
      }
    }

    console.log(`Reprocessing complete: ${results.processed} processed, ${results.failed} failed`)

    return NextResponse.json({
      message: 'Reprocessing complete',
      total: samples.length,
      ...results,
    })
  } catch (error) {
    console.error('Error in reprocess-images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reprocess images' },
      { status: 500 }
    )
  }
}
