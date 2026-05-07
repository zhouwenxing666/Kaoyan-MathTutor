'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import QuestionCard from '@/components/question/QuestionCard'
import SolutionPanel from '@/components/question/SolutionPanel'
import type { Question } from '@/types'

export default function ReviewPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [chapterMap, setChapterMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    fetch('/api/review')
      .then((r) => r.json())
      .then(
        (
          json: {
            data: { questions: Question[]; chapterMap: Record<string, string> } | null
            error: string | null
          }
        ) => {
          if (cancelled) return
          if (json.error || !json.data) {
            setError(json.error || '加载失败')
            return
          }
          setQuestions(json.data.questions)
          setChapterMap(json.data.chapterMap)
        }
      )
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const current = questions[currentIndex]

  const handleAnswer = async (answer: string, isCorrect: boolean) => {
    setShowSolution(true)
    setLastCorrect(isCorrect)
    if (current && isCorrect) {
      setCompleted((prev) => new Set([...prev, current.id]))
    }

    try {
      await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: current?.id,
          userAnswer: answer,
          timeSpentSeconds: null,
        }),
      })
    } catch (e) {
      console.error('[review] submit failed', e)
    }
  }

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
      setShowSolution(false)
      setLastCorrect(null)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setShowSolution(false)
      setLastCorrect(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-32 bg-white rounded-xl border border-gray-100" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">今日没有待复习题目</h2>
          <p className="text-gray-500">回到{' '}
            <Link href="/train" className="text-blue-600 hover:underline">
              专题训练
            </Link>
            {' '}继续刷题吧</p>
        </div>
      </div>
    )
  }

  const chapterName = current?.chapter_code ? chapterMap[current.chapter_code] ?? current.chapter_code : ''

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">今日复习</h1>
        <p className="text-gray-500 mt-1">共 {questions.length} 道待复习题目</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{questions.length}</div>
            <div className="text-sm text-gray-500">待复习</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{completed.size}</div>
            <div className="text-sm text-gray-500">本次答对</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{questions.length - completed.size}</div>
            <div className="text-sm text-gray-500">还需努力</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>复习进度</span>
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {current && (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>
              {current.chapter_code} · {chapterName}
            </span>
          </div>
          <QuestionCard
            key={current.id}
            question={current}
            questionNumber={currentIndex + 1}
            onAnswer={handleAnswer}
            showSolution={showSolution}
          />
          {showSolution && lastCorrect !== null && (
            <SolutionPanel
              isCorrect={lastCorrect}
              explanation={current.explanation ?? ''}
              solution={current.solution ?? undefined}
              knowledgePoints={current.knowledge_points ?? []}
            />
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
            >
              上一题
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={goNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                下一题
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                完成复习
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
