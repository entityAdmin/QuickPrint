import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? 'present' : 'missing')
console.log('Supabase Key exists:', !!supabaseKey)

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')