import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    let samplePhoto: File | null = null

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with image)
      const formData = await request.formData()
      name = formData.get('name') as string | undefined
      product_type = formData.get('product_type') as string | undefined
      notes = formData.get('notes') as string | undefined

      const printTimeStr = formData.get('print_time_minutes') as string | null
      const inkUsageStr = formData.get('ink_usage_ml') as string | null

      print_time_minutes = printTimeStr ? parseInt(printTimeStr) : null
      ink_usage_ml = inkUsageStr ? parseFloat(inkUsageStr) : null

      samplePhoto = formData.get('samplePhoto') as File | null
    } else {
      // Handle JSON
      const body = await request.json()
      name = body.name
      product_type = body.product_type
      notes = body.notes
      print_time_minutes = body.print_time_minutes
      ink_usage_ml = body.ink_usage_ml
    }

    // Build update object - only include core fields that exist in the database
    // Note: print_time_minutes and ink_usage_ml columns need to be added to Supabase
    // Run this SQL: ALTER TABLE samples ADD COLUMN IF NOT EXISTS print_time_minutes INTEGER, ADD COLUMN IF NOT EXISTS ink_usage_ml DECIMAL;
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (product_type !== undefined) updateData.product_type = product_type
    if (notes !== undefined) updateData.notes = notes
    // Temporarily disabled until columns are added to database:
    // if (print_time_minutes !== undefined) updateData.print_time_minutes = print_time_minutes
    // if (ink_usage_ml !== undefined) updateData.ink_usage_ml = ink_usage_ml

    // Handle image upload if provided
    if (samplePhoto && samplePhoto.size > 0) {
      // Get the current sample to delete old image
      const { data: currentSample } = await supabase
        .from('samples')
        .select('thumbnail_url')
        .eq('id', id)
        .single()

      // Delete old thumbnail if it exists
      if (currentSample?.thumbnail_url) {
        const url = new URL(currentSample.thumbnail_url)
        const pathParts = url.pathname.split('/thumbnails/')
        if (pathParts.length > 1) {
          const storagePath = pathParts[1]
          await supabase.storage.from('thumbnails').remove([storagePath])
        }
      }

      // Upload new image
      const fileExt = samplePhoto.name.split('.').pop() || 'jpg'
      const fileName = `${id}-${Date.now()}.${fileExt}`
      const arrayBuffer = await samplePhoto.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, buffer, {
          contentType: samplePhoto.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName)

      updateData.thumbnail_url = publicUrl
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

    // Get the sample first to get the thumbnail path
    const { data: sample, error: fetchError } = await supabase
      .from('samples')
      .select('thumbnail_url')
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
