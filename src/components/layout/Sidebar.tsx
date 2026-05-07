'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  FileX,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface SidebarProps {
  userProfile: UserProfile | null
  userEmail: string | null
}

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/train', label: '专题训练', icon: BookOpen },
  { href: '/review', label: '今日复习', icon: RefreshCw },
  { href: '/wrong', label: '错题本', icon: FileX },
  { href: '/mock', label: '模拟考试', icon: ClipboardList },
  { href: '/profile', label: '个人设置', icon: Settings },
]

const tierLabels: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  enterprise: '企业版',
}

const tierColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  pro: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

export default function Sidebar({ userProfile, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tier = userProfile?.subscription_tier ?? 'free'
  const displayName = userProfile?.name ?? userEmail?.split('@')[0] ?? '用户'

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">考研数学平台</span>
        </div>
      </div>

      {/* 用户信息 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 底部：订阅状态 + 登出 */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">当前套餐</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierColors[tier]}`}>
            {tierLabels[tier]}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
