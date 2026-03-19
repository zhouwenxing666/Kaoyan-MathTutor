'use client'

import { useState } from 'react'
import type { Question } from '@/types'
import MathText from '@/components/common/MathText'

interface ChoiceQuestionProps {
  question: Question
  onAnswer: (answer: string, isCorrect: boolean) => void
  showSolution?: boolean
}

type AnswerState = 'idle' | 'selected' | 'submitted'

export default function ChoiceQuestion({
  question,
  onAnswer,
  showSolution = false
}: ChoiceQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<AnswerState>(
    showSolution ? 'submitted' : 'idle'
  )

  const options = question.options ? Object.entries(question.options) : []

  const handleSelect = (option: string) => {
    if (state !== 'idle') return
    setSelected(option)
  }

  const handleSubmit = () => {
    if (!selected || state !== 'selected') return
    
    const isCorrect = selected === question.answer
    setState('submitted')
    onAnswer(selected, isCorrect)
  }

  // 获取选项样式
  const getOptionStyle = (optionKey: string) => {
    const baseStyle = "w-full p-4 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3"
    
    if (state === 'idle') {
      if (selected === optionKey) {
        return `${baseStyle} border-blue-500 bg-blue-50`
      }
      return `${baseStyle} border-gray-200 hover:border-gray-300 hover:bg-gray-50`
    }
    
    if (state === 'selected') {
      return `${baseStyle} border-gray-200 opacity-50`
    }
    
    // submitted 状态
    if (optionKey === question.answer) {
      return `${baseStyle} border-green-500 bg-green-50`
    }
    if (selected === optionKey && selected !== question.answer) {
      return `${baseStyle} border-red-500 bg-red-50`
    }
    return `${baseStyle} border-gray-200 opacity-50`
  }

  return (
    <div className="space-y-4">
      {/* 选项列表 */}
      <div className="space-y-3">
        {options.map(([key, value]) => (
          <div
            key={key}
            onClick={() => handleSelect(key)}
            className={getOptionStyle(key)}
          >
            <span className={`font-bold text-lg ${
              state === 'submitted'
                ? key === question.answer
                  ? 'text-green-600'
                  : selected === key
                    ? 'text-red-600'
                    : 'text-gray-400'
                : 'text-gray-700'
            }`}>
              {key}.
            </span>
            <MathText content={value} className="flex-1" />
            {state === 'submitted' && key === question.answer && (
              <span className="text-green-500 text-xl">✓</span>
            )}
            {state === 'submitted' && selected === key && key !== question.answer && (
              <span className="text-red-500 text-xl">✗</span>
            )}
          </div>
        ))}
      </div>

      {/* 提交按钮 */}
      {state === 'selected' && (
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          提交答案
        </button>
      )}

      {/* 答案提示 */}
      {state === 'submitted' && (
        <div className={`p-4 rounded-lg ${
          selected === question.answer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-medium ${
            selected === question.answer ? 'text-green-600' : 'text-red-600'
          }`}>
            {selected === question.answer ? '回答正确！🎉' : `回答错误，正确答案是 ${question.answer}`}
          </p>
        </div>
      )}
    </div>
  )
}
