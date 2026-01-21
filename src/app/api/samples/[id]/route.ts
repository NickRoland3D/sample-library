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

    // Parse body
    const body = await request.json()
    const {
      name,
      product_type,
      notes,
      print_time_minutes,
      ink_usage_ml,
      difficulty,
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (product_type !== undefined) updateData.product_type = product_type
    if (notes !== undefined) updateData.notes = notes
    if (print_time_minutes !== undefined) updateData.print_time_minutes = print_time_minutes
    if (ink_usage_ml !== undefined) updateData.ink_usage_ml = ink_usage_ml

    const { data: sample, error } = await supabase
      .from('samples')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
      }
      throw error
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
