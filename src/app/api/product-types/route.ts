import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: productTypes, error } = await supabase
      .from('product_types')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(productTypes)
  } catch (error) {
    console.error('Error fetching product types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const { data: productType, error } = await supabase
      .from('product_types')
      .insert({ name })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Product type already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(productType, { status: 201 })
  } catch (error) {
    console.error('Error creating product type:', error)
    return NextResponse.json(
      { error: 'Failed to create product type' },
      { status: 500 }
    )
  }
}
