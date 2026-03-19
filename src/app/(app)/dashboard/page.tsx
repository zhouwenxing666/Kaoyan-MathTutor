'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

type DashboardStats = {
  todayQuestions: number
  todayCorrect: number
  streak: number
  toReview: number
  totalQuestions: number
  masteredQuestions: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '用户'
          })
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const result = await response.json()
        if (result.data) {
          setStats(result.data)
        }
      } catch (e) {
        console.error('[dashboard] Failed to load stats:', e)
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [])

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'text-green-600'
    if (level >= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          你好，{loading ? '加载中...' : (user?.name || '游客')}
        </h1>
        <p className="text-gray-500 mt-1">今天也要加油哦！💪</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-blue-600">
            {statsLoading ? '-' : (stats?.todayQuestions ?? 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">今日做题</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">
            {statsLoading ? '-' : (stats?.todayCorrect ?? 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">正确数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-orange-500">
            {statsLoading ? '-' : (stats?.streak ?? 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">连续打卡</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-purple-600">
            {statsLoading ? '-' : (stats?.toReview ?? 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">待复习</div>
        </div>
      </div>

      {/* 底部统计 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-gray-700">
            {statsLoading ? '-' : (stats?.totalQuestions ?? 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">历史总做题</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-emerald-600">
            {statsLoading ? '-' : (stats?.masteredQuestions ?? 0)}
          </div>
          <div className="text-gray-500 text-sm mt-1">已掌握</div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-700 text-sm">
          📚 科目进度功能正在开发中，即将上线！
        </p>
      </div>
    </div>
  )
}
