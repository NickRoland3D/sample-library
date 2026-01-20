import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export const createClient = () => {
    const cookieStore = cookies()
    return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
