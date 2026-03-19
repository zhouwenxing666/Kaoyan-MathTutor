'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

interface SolutionPanelProps {
  isCorrect: boolean
  explanation: string
  solution?: string
  knowledgePoints?: string[]
}

export default function SolutionPanel({
  isCorrect,
  explanation,
  solution,
  knowledgePoints = []
}: SolutionPanelProps) {
  const [showFullSolution, setShowFullSolution] = useState(false)

  return (
    <div className={`mt-6 p-5 rounded-xl border-2 animate-in slide-in-from-top-2 duration-300 ${
      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      {/* 结果标识 */}
      <div className="flex items-center gap-2 mb-4">
        {isCorrect ? (
          <>
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-lg font-semibold text-green-700">回答正确！🎉</span>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-red-600" />
            <span className="text-lg font-semibold text-red-700">回答错误</span>
          </>
        )}
      </div>

      {/* 解析 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">解析</span>
        </div>
        <p className="text-gray-700 leading-relaxed pl-6">
          {explanation}
        </p>
      </div>

      {/* 解答题详细步骤（可选展开） */}
      {solution && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <button
            onClick={() => setShowFullSolution(!showFullSolution)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <span>详细解题步骤</span>
            {showFullSolution ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showFullSolution && (
            <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {solution}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 涉及的知识点 */}
      {knowledgePoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">涉及知识点：</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {knowledgePoints.map((kp, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
              >
                {kp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
