'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'

interface Chapter {
  code: string
  name: string
  subject: string
  totalQuestions: number
  attemptedQuestions: number
  masteredQuestions: number
  progress: number // 百分比
}

interface SubjectGroup {
  subject: string
  chapters: Chapter[]
  totalQuestions: number
  attemptedQuestions: number
  masteredQuestions: number
  overallProgress: number
}

export default function TrainPage() {
  const [subjects, setSubjects] = useState<SubjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/chapters/progress')
      .then((res) => res.json())
      .then((json: { data: { bySubject: SubjectGroup[] } | null; error: string | null }) => {
        if (cancelled) return
        if (json.error || !json.data) {
          setError(json.error || '加载章节失败')
          return
        }
        setSubjects(json.data.bySubject)
        if (json.data.bySubject.length > 0) {
          setExpandedSubject(json.data.bySubject[0].subject)
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : '加载章节失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const getProgressColor = (mastered: number, total: number) => {
    const pct = total > 0 ? (mastered / total) * 100 : 0
    if (pct >= 60) return 'bg-green-500'
    if (pct >= 30) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">选择章节练习</h1>
        <p className="text-gray-500 mt-1">选择要练习的章节，开始刷题</p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm">
          暂无章节数据
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div
              key={subject.subject}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedSubject(expandedSubject === subject.subject ? null : subject.subject)
                }
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900">{subject.subject}</span>
                  <span className="text-sm text-gray-400">{subject.chapters.length} 章</span>
                  <span className="text-xs text-gray-400 ml-2">
                    总进度 {subject.overallProgress}%
                  </span>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSubject === subject.subject ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {expandedSubject === subject.subject && (
                <div className="border-t border-gray-100">
                  {subject.chapters.map((chapter, idx) => (
                    <Link
                      key={chapter.code}
                      href={`/train/${chapter.code}`}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                        idx !== subject.chapters.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <span className="w-16 text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {chapter.code}
                      </span>
                      <span className="flex-1 text-gray-800">{chapter.name}</span>
                      <div className="w-32 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${getProgressColor(
                              chapter.masteredQuestions,
                              chapter.totalQuestions
                            )}`}
                            style={{
                              width: `${
                                chapter.totalQuestions > 0
                                  ? Math.min(
                                      100,
                                      (chapter.masteredQuestions / chapter.totalQuestions) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {chapter.masteredQuestions}/{chapter.totalQuestions}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
