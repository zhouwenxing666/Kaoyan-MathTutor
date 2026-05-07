import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// 只刷新 Supabase Session（写回最新 cookie），具体的鉴权重定向交由
// (app)/layout.tsx 与 admin/layout.tsx 在服务端/客户端分别完成。
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // 排除静态资源
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
