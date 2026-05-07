'use client'

import type { Question } from '@/types'
import MathText from '@/components/common/MathText'
import ChoiceQuestion from './ChoiceQuestion'
import FillQuestion from './FillQuestion'
import EssayQuestion from './EssayQuestion'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  onAnswer: (answer: string, isCorrect: boolean) => void
  showSolution?: boolean
}

export default function QuestionCard({
  question,
  questionNumber,
  onAnswer,
  showSolution = false
}: QuestionCardProps) {
  // 获取来源标签（DB 里 source 是自由文本，例如 "2024年真题"）
  const getSourceLabel = () => question.source ?? ''

  // 获取难度标签
  const getDifficultyStars = () => {
    return '★'.repeat(question.difficulty) + '☆'.repeat(5 - question.difficulty)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* 题目头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 text-blue-600 text-sm font-medium px-3 py-1 rounded-full">
            第 {questionNumber} 题
          </span>
          <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">
            {question.type === 'choice' && '选择题'}
            {question.type === 'fill' && '填空题'}
            {question.type === 'essay' && '解答题'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{getSourceLabel()}</span>
          <span className="text-yellow-500 text-sm">{getDifficultyStars()}</span>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="prose prose-sm max-w-none mb-6">
        <MathText content={question.content} className="text-gray-800 text-lg leading-relaxed" />
      </div>

      {/* 不同题型的交互组件 */}
      {question.type === 'choice' && (
        <ChoiceQuestion
          question={question}
          onAnswer={onAnswer}
          showSolution={showSolution}
        />
      )}

      {question.type === 'fill' && (
        <FillQuestion
          question={question}
          onAnswer={onAnswer}
          showSolution={showSolution}
        />
      )}

      {question.type === 'essay' && (
        <EssayQuestion
          question={question}
          onAnswer={onAnswer}
          showSolution={showSolution}
        />
      )}
    </div>
  )
}
