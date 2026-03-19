import { createBrowserClient } from '@supabase/ssr'

// 浏览器端 Supabase 客户端
// 用于客户端组件和 hooks

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (client) return client
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return client
}

// Alias for backward compatibility
export const createClient = getSupabaseClient

// 懒加载的默认客户端
let _supabase: ReturnType<typeof createBrowserClient> | null = null
export function getSupabase() {
  if (!_supabase) {
    _supabase = getSupabaseClient()
  }
  return _supabase
}
