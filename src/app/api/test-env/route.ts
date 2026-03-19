import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'undefined',
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined',
  })
}
