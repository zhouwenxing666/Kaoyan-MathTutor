'use client'

import { useEffect, useState } from 'react'
import type { Question } from '@/types'

export interface UseQuestionsOptions {
  chapter?: string
  type?: string
  limit?: number
}

export function useQuestions(options: UseQuestionsOptions | string) {
  const opts: UseQuestionsOptions =
    typeof options === 'string' ? { chapter: options } : options
  const { chapter, type, limit = 20 } = opts

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(!!chapter)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chapter) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ chapter, limit: String(limit) })
    if (type) params.set('type', type)

    fetch(`/api/questions?${params}`)
      .then(r => r.json())
      .then((json: { data: Question[] | null; error: string | null }) => {
        if (json.error) throw new Error(json.error)
        setQuestions(json.data ?? [])
      })
      .catch(e => setError(e instanceof Error ? e.message : '加载题目失败'))
      .finally(() => setLoading(false))
  }, [chapter, type, limit])

  return { questions, loading, error }
}
