'use client'

import { useState, useEffect } from 'react'
import ChoiceQuestion from '@/components/question/ChoiceQuestion'
import type { QuestionType } from '@/types'

// API返回的错题格式（options为Record格式）
interface WrongQuestion {
  id: string
  chapterCode: string
  chapterName: string
  content: string
  options: { A: string; B: string; C: string; D: string } | null
  userAnswer: string
  correctAnswer: string
  explanation: string
  timesWrong: number
  lastWrongAt: string
}

type TabKey = 'all' | 'knowledge' | 'concept' | 'calculation'

// 按题目类型过滤
function filterByType(questions: WrongQuestion[], type: TabKey): WrongQuestion[] {
  if (type === 'all') return questions
  return questions.filter((q) => {
    // 简单根据内容长度或是否带计算判断（实际可按真实字段区分）
    return true
  })
}

export default function WrongPage() {
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/wrong-questions')
      .then((res) => res.json())
      .then((data) => {
        if (data.questions) {
          setQuestions(data.questions)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterByType(questions, activeTab)

  const handleAnswer = (questionId: string, selectedAnswer: string) => {
    setAnsweredSet((prev) => new Set([...prev, questionId]))

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const isCorrect = selectedAnswer === q.correctAnswer
        return {
          ...q,
          // 暂时乐观更新，用户答对则从错题本移除（后端自动处理）
          timesWrong: isCorrect ? q.timesWrong - 1 : q.timesWrong,
        }
      })
    )

    // 触发重新渲染
    setTimeout(() => setQuestions((prev) => [...prev]), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">暂无错题</h2>
            <p className="text-gray-500">太棒了！你的错题本空空如也</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">错题本</h1>
          <p className="text-gray-500 text-sm mt-1">
            共 {questions.length} 道错题 · 点击卡片查看详情
          </p>
        </div>

        {/* 过滤标签 */}
        <div className="flex gap-2 mb-6">
          {(['all', 'knowledge', 'concept', 'calculation'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'all'
                ? '全部'
                : tab === 'knowledge'
                ? '知识点'
                : tab === 'concept'
                ? '概念'
                : '计算'}
            </button>
          ))}
        </div>

        {/* 错题列表 */}
        <div className="space-y-4">
          {filtered.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* 卡片头部 */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === question.id ? null : question.id)
                }
              >
                {/* 序号 + 章节标签 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">#{index + 1}</span>
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    {question.chapterName} · {question.timesWrong}次错误
                  </span>
                </div>

                {/* 题目内容（预览） */}
                <p className="text-gray-800 line-clamp-2">{question.content}</p>

                {/* 展开箭头 */}
                <div className="flex justify-end mt-2">
                  <span className="text-gray-400 text-sm">
                    {expandedId === question.id ? '收起' : '展开'}
                  </span>
                </div>
              </div>

              {/* 展开的详情 */}
              {expandedId === question.id && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <ChoiceQuestion
                    question={{
                      id: question.id,
                      type: 'choice' as QuestionType,
                      content: question.content,
                      options: question.options
                        ? (Object.entries(question.options).map(([id, content]) => ({
                            id: id as 'A' | 'B' | 'C' | 'D',
                            content,
                          })))
                        : null,
                      answer: question.correctAnswer,
                      explanation: question.explanation ?? null,
                      solution: null,
                      difficulty: 3,
                      source: null,
                      chapter_code: question.chapterCode,
                      knowledge_points: null,
                      is_essay: false,
                      created_at: '',
                    }}
                    onAnswer={(answer) => handleAnswer(question.id, answer)}
                    showSolution={answeredSet.has(question.id)}
                  />

                  {/* 正确答案提示 */}
                  {answeredSet.has(question.id) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="text-gray-600">
                        你的答案:{' '}
                        <span
                          className={
                            question.userAnswer === question.correctAnswer
                              ? 'text-green-600 font-bold'
                              : 'text-red-600 font-bold'
                          }
                        >
                          {question.userAnswer || '未作答'}
                        </span>
                      </p>
                      {question.explanation && (
                        <p className="text-gray-500 mt-1">
                          解析: {question.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
