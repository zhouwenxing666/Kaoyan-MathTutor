'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import QuestionCard from '@/components/question/QuestionCard'
import ChoiceQuestion from '@/components/question/ChoiceQuestion'
import FillQuestion from '@/components/question/FillQuestion'
import EssayQuestion from '@/components/question/EssayQuestion'
import SolutionPanel from '@/components/question/SolutionPanel'
import { ChevronLeft, ChevronRight, MessageCircle, BarChart2 } from 'lucide-react'
import type { Question } from '@/types'

// 模拟题目数据
const mockQuestions: Question[] = [
  {
    id: '1',
    type: 'choice',
    content: '设函数 $f(x) = \lim_{n \\to \\infty} \\frac{x^{2n+1} + a x^2 + b x}{x^{2n} + 1}$ 在 $(-\\infty, +\\infty)$ 上连续，则 $a, b$ 的值为',
    options: {
      A: '$a = 0, b = 1$',
      B: '$a = 1, b = 0$',
      C: '$a = 0, b = 0$',
      D: '$a = 1, b = 1$',
    },
    answer: 'C',
    solution: '由连续性条件 $\\lim_{x \\to 1} f(x) = f(1)$ 可得 $a + b = 1$，再由 $\\lim_{x \\to -1} f(x) = f(-1)$ 可得 $-a + b = -1$，解得 $a = 1, b = 0$。',
    difficulty: 3,
    source: 'real_exam',
  },
  {
    id: '2',
    type: 'fill',
    content: '设 $f(x, y) = \\begin{cases} \\frac{x^2 y^2}{x^2 + y^2}, & (x, y) \\neq (0, 0) \\\\ 0, & (x, y) = (0, 0) \\end{cases}$，则 $\\frac{\\partial f}{\\partial x}(0, 0) = $ ____________',
    answer: '0',
    solution: '按定义 $\\frac{\\partial f}{\\partial x}(0, 0) = \\lim_{\\Delta x \\to 0} \\frac{f(\\Delta x, 0) - f(0,0)}{\\Delta x} = \\lim_{\\Delta x \\to 0} \\frac{0 - 0}{\\Delta x} = 0$。',
    difficulty: 4,
    source: 'real_exam',
  },
  {
    id: '3',
    type: 'essay',
    content: '设 $f(x)$ 在 $[0, 1]$ 上连续，在 $(0, 1)$ 内可导，且 $f(0) = 0, f(1) = 1$。证明：存在 $\\xi \\in (0, 1)$ 使得 $f(\\xi) = 1 - \\xi$。',
    solution: '构造辅助函数 $F(x) = f(x) - (1 - x) = f(x) + x - 1$。由题意 $F(0) = -1 < 0, F(1) = 1 > 0$，由零点定理可知存在 $\\xi \\in (0, 1)$ 使得 $F(\\xi) = 0$，即 $f(\\xi) = 1 - \\xi$。',
    difficulty: 3,
    source: 'real_exam',
  },
]

export default function TrainChapterPage() {
  const params = useParams()
  const chapterCode = params.chapterCode as string

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [sessionType, setSessionType] = useState<'train' | 'exam'>('train')

  const currentQuestion = mockQuestions[currentIndex]

  const handleSubmit = useCallback((answer: string) => {
    setUserAnswer(answer)
    setShowSolution(true)
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < mockQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setUserAnswer('')
      setShowSolution(false)
    }
  }, [currentIndex])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setUserAnswer('')
      setShowSolution(false)
    }
  }, [currentIndex])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* 左侧：题目区 */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-semibold text-gray-900">第 {currentIndex + 1} / {mockQuestions.length} 题</h2>
              <p className="text-sm text-gray-500">{chapterCode} · {currentQuestion.source}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sessionType}
              onChange={e => setSessionType(e.target.value as 'train' | 'exam')}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              <option value="train">练习模式</option>
              <option value="exam">考试模式</option>
            </select>
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                showAIPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              AI 助教
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-100 rounded-full h-1 mb-6">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / mockQuestions.length) * 100}%` }}
          />
        </div>

        {/* 题目卡片 */}
        <div className="flex-1 overflow-y-auto">
          <QuestionCard
            index={currentIndex + 1}
            difficulty={currentQuestion.difficulty}
            source={currentQuestion.source}
            knowledgePoints={currentQuestion.knowledgePoints}
          >
            <p className="text-gray-800 leading-relaxed">{currentQuestion.content}</p>
          </QuestionCard>

          {/* 答题区 */}
          <div className="mt-6">
            {currentQuestion.type === 'choice' && (
              <ChoiceQuestion
                options={currentQuestion.options || []}
                onSubmit={handleSubmit}
                disabled={showSolution}
                isRevealed={showSolution}
              />
            )}
            {currentQuestion.type === 'fill' && (
              <FillQuestion
                onSubmit={handleSubmit}
                disabled={showSolution}
                isRevealed={showSolution}
              />
            )}
            {currentQuestion.type === 'essay' && (
              <EssayQuestion
                onSubmit={handleSubmit}
                disabled={showSolution}
                isRevealed={showSolution}
              />
            )}
          </div>

          {/* 解析区 */}
          {showSolution && (
            <SolutionPanel
              isCorrect={userAnswer === currentQuestion.answer}
              explanation={currentQuestion.solution || ''}
              solution={currentQuestion.solution}
            />
          )}
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 flex items-center gap-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一题
          </button>

          {currentIndex < mockQuestions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              下一题
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              完成练习
            </button>
          )}
        </div>
      </div>

      {/* 右侧：AI 助教面板 */}
      {showAIPanel && (
        <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-semibold text-gray-900">AI 助教</h3>
            <p className="text-sm text-gray-500 mt-0.5">针对当前题目提问</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 text-sm text-gray-600">
              <p>💡 提示：你可以点击题目下方的按钮，让 AI 为你详细解释本题的解题思路。</p>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 bg-white">
            <input
              type="text"
              placeholder="输入问题..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
