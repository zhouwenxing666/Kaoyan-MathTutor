'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAILS = ['1804808430@qq.com']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      if (data.user && ADMIN_EMAILS.includes(data.user.email || '')) {
        setUser(data.user)
      } else {
        router.push('/login?redirect=/admin/questions')
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">🧮 考研数学导师</h1>
          <p className="text-xs text-muted-foreground mt-0.5">管理员后台</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/admin/questions" active={pathname === '/admin/questions' || pathname.startsWith('/admin/questions')}>
            📝 题目管理
          </NavLink>
          <NavLink href="/admin/chapters" active={pathname.startsWith('/admin/chapters')}>
            📚 章节管理
          </NavLink>
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-muted-foreground mb-2">{user.email}</div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="w-full text-left text-xs text-red-500 hover:text-red-600"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </Link>
  )
}
