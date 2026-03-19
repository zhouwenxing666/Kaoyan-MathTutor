'use client'

import { useState } from 'react'
import type { Question } from '@/types'
import MathText from '@/components/common/MathText'

interface EssayQuestionProps {
  question: Question
  onAnswer: (answer: string, isCorrect: boolean) => void
  showSolution?: boolean
}

export default function EssayQuestion({ question, onAnswer, showSolution = false }: EssayQuestionProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(showSolution)
  const [rated, setRated] = useState(false)

  const handleSubmit = () => {
    if (!answer.trim() || submitted) return
    setSubmitted(true)
  }

  const handleRate = (isCorrect: boolean) => {
    if (rated) return
    setRated(true)
    onAnswer(answer || '（已查看解答）', isCorrect)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          解题过程
        </label>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          disabled={submitted}
          placeholder="在此写下你的解题过程..."
          rows={6}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 resize-none"
        />
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          查看解答
        </button>
      )}

      {submitted && question.solution && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">参考解答</p>
          <MathText content={question.solution} className="text-gray-700 leading-relaxed text-sm" />
        </div>
      )}

      {submitted && !rated && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800 mb-3">对比参考解答，给自己打个分：</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleRate(true)}
              className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors font-medium"
            >
              ✓ 已掌握
            </button>
            <button
              onClick={() => handleRate(false)}
              className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors font-medium"
            >
              ✗ 还需练习
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
