import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processImage } from '@/lib/imageProcessing'

// Use service role for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: samples, error } = await supabase
      .from('samples')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(samples)
  } catch (error) {
    console.error('Error fetching samples:', error)
    return NextResponse.json(
      { error: 'Failed to fetch samples' },
      { status: 500 }
    )
  }
}

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

    // Parse form data
    const formData = await request.formData()
    const name = formData.get('name') as string
    const productType = formData.get('productType') as string
    const notes = formData.get('notes') as string
    const onedriveFolderUrl = formData.get('onedriveFolderUrl') as string
    const samplePhoto = formData.get('samplePhoto') as File

    if (!name || !productType || !samplePhoto || !onedriveFolderUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process the image (background removal if needed + whitespace normalization)
    const rawBuffer = Buffer.from(await samplePhoto.arrayBuffer())

    console.log('Processing uploaded image...')
    const { buffer: processedBuffer, wasBackgroundRemoved } = await processImage(rawBuffer)
    console.log(`Image processing complete. Background removed: ${wasBackgroundRemoved}`)

    // Upload processed photo to Supabase storage (always save as JPEG after processing)
    const photoPath = `samples/${user.id}/${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(photoPath, processedBuffer, {
        contentType: 'image/jpeg',
      })

    if (uploadError) {
      console.error('Photo upload error:', uploadError)
      throw new Error('Failed to upload photo')
    }

    // Get public URL for the photo
    const {
      data: { publicUrl },
    } = supabase.storage.from('thumbnails').getPublicUrl(photoPath)

    // Create sample record
    const { data: sample, error: insertError } = await supabase
      .from('samples')
      .insert({
        name,
        product_type: productType,
        notes: notes || null,
        thumbnail_url: publicUrl,
        onedrive_folder_url: onedriveFolderUrl,
        onedrive_folder_id: 'manual', // Placeholder for manual links
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Failed to create sample record')
    }

    return NextResponse.json(sample, { status: 201 })
  } catch (error) {
    console.error('Error creating sample:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create sample' },
      { status: 500 }
    )
  }
}
