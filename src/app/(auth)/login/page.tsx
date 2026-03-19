'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { BookOpen } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabaseRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null)

  useEffect(() => {
    // 延迟初始化，避免构建时执行
    try {
      supabaseRef.current = getSupabaseClient()
    } catch (e) {
      // 环境变量可能不可用，构建时忽略
    }
  }, [])

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    const supabase = supabaseRef.current
    if (!supabase) return

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">考研数学学习平台</h1>
          <p className="text-gray-500 mt-1 text-sm">登录后开始高效备考</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!sent ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-6">邮箱登录</h2>

              <form onSubmit={handleSendLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    邮箱地址
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? '发送中...' : '发送登录链接'}
                </button>
              </form>

              {/* 微信登录（预留） */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs text-gray-400">
                    <span className="bg-white px-2">或</span>
                  </div>
                </div>
                <button
                  disabled
                  className="mt-4 w-full border border-gray-200 text-gray-400 py-3 rounded-lg font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>微信登录（即将开放）</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">登录链接已发送</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                我们已向 <span className="font-medium text-gray-700">{email}</span> 发送了登录链接，
                请查收邮件并点击链接完成登录。
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-blue-600 text-sm hover:underline"
              >
                重新发送
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
