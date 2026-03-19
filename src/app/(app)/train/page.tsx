'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight, BarChart2 } from 'lucide-react'

interface Chapter {
  code: string
  name: string
  level: number
  totalQuestions: number
  masteredQuestions: number
}

interface Subject {
  name: string
  chapters: Chapter[]
}

const subjects: Subject[] = [
  {
    name: '高等数学',
    chapters: [
      { code: 'H01', name: '函数与极限', level: 3, totalQuestions: 50, masteredQuestions: 15 },
      { code: 'H02', name: '导数与微分', level: 2, totalQuestions: 45, masteredQuestions: 8 },
      { code: 'H03', name: '微分中值定理', level: 1, totalQuestions: 40, masteredQuestions: 3 },
      { code: 'H04', name: '不定积分', level: 1, totalQuestions: 42, masteredQuestions: 5 },
      { code: 'H05', name: '定积分', level: 2, totalQuestions: 48, masteredQuestions: 10 },
    ]
  },
  {
    name: '线性代数',
    chapters: [
      { code: 'X01', name: '行列式', level: 4, totalQuestions: 35, masteredQuestions: 20 },
      { code: 'X02', name: '矩阵', level: 2, totalQuestions: 55, masteredQuestions: 12 },
      { code: 'X03', name: '向量组', level: 1, totalQuestions: 40, masteredQuestions: 5 },
      { code: 'X04', name: '线性方程组', level: 3, totalQuestions: 38, masteredQuestions: 18 },
    ]
  },
  {
    name: '概率论',
    chapters: [
      { code: 'G01', name: '随机事件与概率', level: 3, totalQuestions: 40, masteredQuestions: 10 },
      { code: 'G02', name: '一维随机变量', level: 2, totalQuestions: 45, masteredQuestions: 8 },
      { code: 'G03', name: '二维随机变量', level: 1, totalQuestions: 42, masteredQuestions: 4 },
      { code: 'G04', name: '数字特征', level: 2, totalQuestions: 36, masteredQuestions: 7 },
    ]
  }
]

export default function TrainPage() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>('高等数学')

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 text-green-700'
    if (level >= 2) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

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

      <div className="space-y-4">
        {subjects.map(subject => (
          <div key={subject.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 科目头部 */}
            <button
              onClick={() => setExpandedSubject(expandedSubject === subject.name ? null : subject.name)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">{subject.name}</span>
                <span className="text-sm text-gray-400">
                  {subject.chapters.length} 章
                </span>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSubject === subject.name ? 'rotate-90' : ''}`}
              />
            </button>

            {/* 章节列表 */}
            {expandedSubject === subject.name && (
              <div className="border-t border-gray-100">
                {subject.chapters.map((chapter, idx) => (
                  <Link
                    key={chapter.code}
                    href={`/train/${chapter.code}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx !== subject.chapters.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <span className="w-16 text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {chapter.code}
                    </span>
                    <span className="flex-1 text-gray-800">{chapter.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(chapter.level)}`}>
                      L{chapter.level}
                    </span>
                    <div className="w-24 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getProgressColor(chapter.masteredQuestions, chapter.totalQuestions)}`}
                          style={{ width: `${(chapter.masteredQuestions / chapter.totalQuestions) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">
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
    </div>
  )
}
