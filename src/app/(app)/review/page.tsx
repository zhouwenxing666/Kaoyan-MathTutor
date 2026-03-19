'use client'

import { useState } from 'react'
import { Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import ChoiceQuestion from '@/components/question/ChoiceQuestion'
import SolutionPanel from '@/components/question/SolutionPanel'
import MathText from '@/components/common/MathText'
import type { Question } from '@/types'

interface ReviewQuestion {
  id: string
  content: string
  answer: string
  options?: { id: string; content: string }[]
  explanation: string
  chapterCode: string
  chapterName: string
  nextReviewAt: string
}

const mockReviewQuestions: ReviewQuestion[] = [
  {
    id: '1',
    content: '设 $f(x) = \\frac{x^2 - 4}{x - 2}$，则 $f(x)$ 在 $x = 2$ 处',
    answer: 'C',
    options: [
      { id: 'A', content: '连续' },
      { id: 'B', content: '可导' },
      { id: 'C', content: '间断' },
      { id: 'D', content: '无法判断' },
    ],
    explanation: '$\\lim_{x \\to 2} f(x) = \\lim_{x \\to 2} \\frac{(x-2)(x+2)}{x-2} = 4 \\neq f(2)$（$f(2)$ 不存在），故为可去间断点。',
    chapterCode: 'H01',
    chapterName: '函数与极限',
    nextReviewAt: '今天 20:00',
  },
  {
    id: '2',
    content: '若 $\\lim_{n \\to \\infty} a_n = A$，则 $\\lim_{n \\to \\infty} \\frac{a_1 + a_2 + ... + a_n}{n} = $',
    answer: 'A',
    options: [
      { id: 'A', content: '$A$' },
      { id: 'B', content: '$A/2$' },
      { id: 'C', content: '$2A$' },
      { id: 'D', content: '无法确定' },
    ],
    explanation: '由 Stolz 定理，$\\lim_{n \\to \\infty} \\frac{S_n}{n} = \\lim_{n \\to \\infty} \\frac{S_n - S_{n-1}}{n - (n-1)} = \\lim_{n \\to \\infty} a_n = A$。',
    chapterCode: 'H01',
    chapterName: '函数与极限',
    nextReviewAt: '今天 22:00',
  },
]

export default function ReviewPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const current = mockReviewQuestions[currentIndex]
  const isCompleted = completed.has(current.id)

  const handleSubmit = (answer: string) => {
    setUserAnswer(answer)
    setShowSolution(true)
    if (answer === current.answer) {
      setCompleted(prev => new Set([...prev, current.id]))
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">今日复习</h1>
        <p className="text-gray-500 mt-1">共 {mockReviewQuestions.length} 道待复习题目</p>
      </div>

      {/* 复习统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{mockReviewQuestions.length}</div>
            <div className="text-sm text-gray-500">待复习</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{completed.size}</div>
            <div className="text-sm text-gray-500">已掌握</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{mockReviewQuestions.length - completed.size}</div>
            <div className="text-sm text-gray-500">还需努力</div>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>复习进度</span>
          <span>{currentIndex + 1} / {mockReviewQuestions.length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / mockReviewQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 当前题目 */}
      {current && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <BookOpen className="w-4 h-4" />
            <span>{current.chapterCode} · {current.chapterName}</span>
            <span className="ml-auto text-orange-500">下次复习：{current.nextReviewAt}</span>
          </div>

          <div className="mb-6">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mr-2">第 {currentIndex + 1} 题</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">选择题</span>
            <MathText content={current.content} className="text-gray-800 text-lg leading-relaxed mt-4 block" />
          </div>

          <ChoiceQuestion
            question={{
              id: current.id,
              subject_id: 1,
              chapter_id: 1,
              knowledge_point_id: null,
              type: 'choice',
              content: current.content,
              options: Object.fromEntries(
                (current.options || []).map(o => [o.id, o.content])
              ) as Record<'A' | 'B' | 'C' | 'D', string>,
              answer: current.answer,
              solution: null,
              source: 'original',
              year: null,
              pool_type: null,
              difficulty: 3,
              is_published: true,
              created_at: '',
            } satisfies Question}
            onAnswer={(answer) => handleSubmit(answer)}
            showSolution={showSolution}
          />

          {showSolution && (
            <SolutionPanel
              isCorrect={userAnswer === current.answer}
              explanation={current.explanation}
            />
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(prev => prev - 1)
                  setShowSolution(false)
                  setUserAnswer('')
                }
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
            >
              上一题
            </button>

            {currentIndex < mockReviewQuestions.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentIndex(prev => prev + 1)
                  setShowSolution(false)
                  setUserAnswer('')
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                下一题
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                完成复习
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
