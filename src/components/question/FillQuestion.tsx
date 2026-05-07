'use client'

import { useState } from 'react'
import type { Question } from '@/types'

interface FillQuestionProps {
  question: Question
  onAnswer: (answer: string, isCorrect: boolean) => void
  showSolution?: boolean
}

export default function FillQuestion({
  question,
  onAnswer,
  showSolution = false
}: FillQuestionProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(showSolution)

  const correctAnswer = (question.answer ?? '').trim().toLowerCase()

  const handleSubmit = () => {
    if (!answer.trim()) return
    const isCorrect = !!correctAnswer && answer.trim().toLowerCase() === correctAnswer
    setSubmitted(true)
    onAnswer(answer, isCorrect)
  }

  const isAnswerMatch = !!correctAnswer && answer.trim().toLowerCase() === correctAnswer

  return (
    <div className="space-y-4">
      {/* 答案输入框 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          请输入你的答案
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={submitted}
          placeholder="输入答案..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* 提交按钮 */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          提交答案
        </button>
      )}

      {/* 答案提示 */}
      {submitted && (
        <div
          className={`p-4 rounded-lg ${
            isAnswerMatch ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <p className={`font-medium ${isAnswerMatch ? 'text-green-600' : 'text-red-600'}`}>
            {isAnswerMatch ? '回答正确！🎉' : `回答错误，正确答案是：${question.answer ?? ''}`}
          </p>
        </div>
      )}
    </div>
  )
}
