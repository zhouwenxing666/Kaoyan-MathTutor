import Link from 'next/link'
import { GraduationCap, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'

interface NavbarProps {
  isAuthed?: boolean
}

export default function Navbar({ isAuthed = false }: NavbarProps) {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <GraduationCap className="h-6 w-6" />
            <span>考研数学平台</span>
          </Link>
          <div className="flex items-center gap-6">
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                进入仪表盘
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  登录
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
