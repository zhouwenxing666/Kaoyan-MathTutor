import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 获取用户信息
async function getUser(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  
  if (!accessToken || !refreshToken) {
    return null
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    })

    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Auth error:', error)
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 公开路径不需要认证
  const publicPaths = ['/', '/login', '/register', '/api/', '/_next']
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 检查用户认证
  const user = await getUser(request)
  
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
