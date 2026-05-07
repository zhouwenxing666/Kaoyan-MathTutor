'use client'

import { useEffect, useState } from 'react'
import { User, BookOpen, CheckCircle, TrendingUp } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

type DashboardStats = {
  todayQuestions: number
  todayCorrect: number
  streak: number
  toReview: number
  totalQuestions: number
  masteredQuestions: number
}

const TIER_LABELS: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  enterprise: '企业版',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', target_school: '', target_subject: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        setEmail(user.email ?? '')

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profileData) {
          setProfile(profileData as UserProfile)
          setForm({
            name: profileData.name ?? '',
            target_school: profileData.target_school ?? '',
            target_subject: profileData.target_subject ?? '考研数学',
          })
        }

        const res = await fetch('/api/stats')
        const json = await res.json()
        if (json.data) setStats(json.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: form.name || null,
          target_school: form.target_school || null,
          target_subject: form.target_subject || null,
        })
        .eq('id', profile.id)
      if (error) {
        setSaveMsg(error.message)
      } else {
        setProfile({
          ...profile,
          name: form.name || null,
          target_school: form.target_school || null,
          target_subject: form.target_subject || null,
        })
        setEditing(false)
        setSaveMsg('保存成功')
      }
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile?.name || email.split('@')[0] || '用户'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">个人中心</h1>

      <div className="mb-6 flex items-center gap-5 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-900">{loading ? '加载中…' : displayName}</p>
          <p className="text-sm text-gray-500">{email}</p>
          {profile?.target_school && (
            <p className="text-xs text-gray-400 mt-1">目标院校：{profile.target_school}</p>
          )}
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
          {profile ? TIER_LABELS[profile.subscription_tier] ?? profile.subscription_tier : '—'}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<BookOpen className="h-5 w-5 text-blue-600" />} label="累计练题" value={stats?.totalQuestions ?? '—'} />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
          label="正确率"
          value={
            stats && stats.totalQuestions > 0
              ? `${Math.round((stats.todayCorrect / Math.max(stats.todayQuestions, 1)) * 100)}%`
              : '—'
          }
        />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-blue-600" />} label="连续打卡" value={stats?.streak !== undefined ? `${stats.streak}天` : '—'} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">账号设置</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">
              编辑
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditing(false)
                  setSaveMsg(null)
                  if (profile) {
                    setForm({
                      name: profile.name ?? '',
                      target_school: profile.target_school ?? '',
                      target_subject: profile.target_subject ?? '考研数学',
                    })
                  }
                }}
                className="text-sm text-gray-500 hover:underline"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <Field label="昵称">
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 w-48 text-right focus:outline-none focus:border-blue-500"
                placeholder="请输入昵称"
              />
            ) : (
              <span className="font-medium text-gray-700">{profile?.name || '未设置'}</span>
            )}
          </Field>
          <Field label="目标科目">
            {editing ? (
              <select
                value={form.target_subject}
                onChange={(e) => setForm((f) => ({ ...f, target_subject: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-right focus:outline-none focus:border-blue-500"
              >
                <option>考研数学</option>
                <option>数学一</option>
                <option>数学二</option>
                <option>数学三</option>
              </select>
            ) : (
              <span className="font-medium text-gray-700">
                {profile?.target_subject || '考研数学'}
              </span>
            )}
          </Field>
          <Field label="目标院校">
            {editing ? (
              <input
                value={form.target_school}
                onChange={(e) => setForm((f) => ({ ...f, target_school: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 w-48 text-right focus:outline-none focus:border-blue-500"
                placeholder="可选"
              />
            ) : (
              <span className="font-medium text-gray-700">{profile?.target_school || '未设置'}</span>
            )}
          </Field>
          <Field label="每日 AI 配额">
            <span className="font-medium text-gray-700">{profile?.daily_ai_quota ?? 3} 次/天</span>
          </Field>
        </div>

        {saveMsg && (
          <p className="mt-4 text-xs text-blue-600">{saveMsg}</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100 text-center">
      <div className="mx-auto mb-3 inline-flex rounded-lg bg-blue-50 p-3">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
      <span className="text-gray-500">{label}</span>
      {children}
    </div>
  )
}
