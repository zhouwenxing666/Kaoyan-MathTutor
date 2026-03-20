'use client'

import { useState } from 'react'
import Navbar from "@/components/Navbar";
import { FileText, Clock, Target } from "lucide-react";
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const subjects = [
  { label: "数学一", value: "math1", description: "适用专业：理工科" },
  { label: "数学二", value: "math2", description: "适用专业：工科" },
  { label: "数学三", value: "math3", description: "适用专业：经济管理" },
];

const recentTopics = [
  { name: "极限与连续", count: 42, accuracy: 78 },
  { name: "导数与微分", count: 56, accuracy: 65 },
  { name: "不定积分", count: 38, accuracy: 82 },
  { name: "定积分", count: 31, accuracy: 71 },
  { name: "多元函数微分法", count: 24, accuracy: 58 },
];

// 题目数据结构
interface Question {
  id: string
  content: string
  level: '容易' | '中等' | '难'
  subject: '高等数学' | '线性代数' | '概率论'
}

// 模拟题目数据（后续可替换为 API 获取）
const mockQuestions: Question[] = [
  { id: '1', content: '设函数 f(x) 在 x=0 处连续，则 lim(x→0) f(x)/x 存在', level: '中等', subject: '高等数学' },
  { id: '2', content: '求矩阵 A 的特征值和特征向量', level: '中等', subject: '线性代数' },
  { id: '3', content: '设随机变量 X ~ N(0,1)，求 P(|X|<1.96)', level: '容易', subject: '概率论' },
  { id: '4', content: '证明：若函数 f(x) 在 [a,b] 上连续，则 f(x) 在 [a,b] 上有界', level: '难', subject: '高等数学' },
  { id: '5', content: '计算行列式 |A| 的值', level: '容易', subject: '线性代数' },
  { id: '6', content: '设总体 X ~ N(μ,σ²)，求 μ 的极大似然估计', level: '中等', subject: '概率论' },
]

export default function StudyPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  const handleLevelChange = (value: string | null) => { if (value) setLevelFilter(value) }
  const handleSubjectChange = (value: string | null) => { if (value) setSubjectFilter(value) }

  const filteredQuestions = mockQuestions.filter(q => {
    const matchSearch = searchQuery === '' ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchLevel = levelFilter === 'all' || q.level === levelFilter
    const matchSubject = subjectFilter === 'all' || q.subject === subjectFilter
    return matchSearch && matchLevel && matchSubject
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">学习中心</h1>

        {/* 搜索筛选区域 */}
        <div className="mb-6 flex gap-4 flex-wrap">
          {/* 搜索框 */}
          <Input
            placeholder="搜索题目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />

          {/* 难度筛选 */}
          <Select value={levelFilter} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部难度</SelectItem>
              <SelectItem value="容易">容易</SelectItem>
              <SelectItem value="中等">中等</SelectItem>
              <SelectItem value="难">难</SelectItem>
            </SelectContent>
          </Select>

          {/* 学科筛选 */}
          <Select value={subjectFilter} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="学科" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学科</SelectItem>
              <SelectItem value="高等数学">高等数学</SelectItem>
              <SelectItem value="线性代数">线性代数</SelectItem>
              <SelectItem value="概率论">概率论</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 筛选结果展示 */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">题目列表（共 {filteredQuestions.length} 道）</h2>
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <p className="text-gray-500 text-sm">未找到匹配的题目</p>
            ) : (
              filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      q.level === '容易' ? 'bg-green-100 text-green-700' :
                      q.level === '中等' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {q.level}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {q.subject}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm">{q.content}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Subject selection */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">选择科目</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {subjects.map((s) => (
              <button
                key={s.value}
                className="rounded-xl border-2 border-transparent bg-white p-5 text-left shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
              >
                <p className="text-lg font-bold text-gray-900">{s.label}</p>
                <p className="mt-1 text-sm text-gray-500">{s.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">快速开始</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl bg-blue-600 p-5 text-white shadow">
              <FileText className="h-8 w-8 opacity-90" />
              <div>
                <p className="font-semibold">真题模式</p>
                <p className="text-sm opacity-80">按年份刷真题</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-emerald-600 p-5 text-white shadow">
              <Target className="h-8 w-8 opacity-90" />
              <div>
                <p className="font-semibold">专题练习</p>
                <p className="text-sm opacity-80">按知识点突破</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-amber-500 p-5 text-white shadow">
              <Clock className="h-8 w-8 opacity-90" />
              <div>
                <p className="font-semibold">错题复习</p>
                <p className="text-sm opacity-80">巩固薄弱环节</p>
              </div>
            </div>
          </div>
        </section>

        {/* Topics */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">知识点概览</h2>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">知识点</th>
                  <th className="px-6 py-3 text-right font-medium">已练题数</th>
                  <th className="px-6 py-3 text-right font-medium">正确率</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTopics.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{t.count} 题</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          t.accuracy >= 75 ? "text-emerald-600" : "text-amber-500"
                        }`}
                      >
                        {t.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
