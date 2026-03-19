'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DashboardStats } from '@/types'

export function useProgress() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/progress')
      const json: { data: DashboardStats | null; error: string | null } = await res.json()
      if (json.error) throw new Error(json.error)
      setStats(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { stats, loading, error, refresh }
}
