'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LatexEditor } from './LatexEditor'
import { MathText } from '@/components/common/MathText'

type QuestionType = 'choice' | 'fill' | 'essay'
type Difficulty = 1 | 2 | 3

type OptionItem = {
  id: string
  content: string
}

type Chapter = {
  id: number
  code: string
  name: string
  subject: string
}

type FormData = {
  type: QuestionType
  content: string
  options: OptionItem[]
  answer: string
  explanation: string
  difficulty: Difficulty
  chapter_code: string
  knowledge_points: string[]
  source: string
}

const CHOICE_OPTIONS = [
  { id: 'A', label: 'A' },
  { id: 'B', label: 'B' },
  { id: 'C', label: 'C' },
  { id: 'D', label: 'D' },
]

export function QuestionForm({
  initialData,
  isEdit = false,
}: {
  initialData?: any
  isEdit?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  const [form, setForm] = useState<FormData>({
    type: initialData?.type || 'choice',
    content: initialData?.content || '',
    options: initialData?.options || [
      { id: 'A', content: '' },
      { id: 'B', content: '' },
      { id: 'C', content: '' },
      { id: 'D', content: '' },
    ],
    answer: initialData?.answer || '',
    explanation: initialData?.explanation || '',
    difficulty: (initialData?.difficulty as Difficulty) || 2,
    chapter_code: initialData?.chapter_code || '',
    knowledge_points: initialData?.knowledge_points || [],
    source: initialData?.source || '',
  })

  useEffect(() => {
    loadChapters()
  }, [])

  async function loadChapters() {
    const { data } = await supabase
      .from('chapters')
      .select('id, code, name, subject')
      .order('subject')
      .order('level')
    if (data) setChapters(data as Chapter[])
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.content.trim()) newErrors.content = '请输入题目内容'
    if (!form.chapter_code) newErrors.chapter_code = '请选择章节'
    if (!form.answer.trim()) newErrors.answer = '请输入答案'

    if (form.type === 'choice') {
      const emptyOptions = form.options.filter(o => !o.content.trim())
      if (emptyOptions.length > 0) {
        newErrors.options = '请填写所有选项内容'
      }
      if (!form.answer.trim()) newErrors.answer = '请选择正确答案'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent, status: 'draft' | 'published' = 'published') {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const payload = {
      type: form.type,
      content: form.content,
      options: form.type === 'choice' ? form.options : null,
      answer: form.answer,
      explanation: form.explanation || null,
      solution: null,
      difficulty: form.difficulty,
      source: form.source || null,
      chapter_code: form.chapter_code,
      knowledge_points: form.knowledge_points,
      is_essay: form.type === 'essay',
    }

    let error
    if (isEdit && initialData?.id) {
      const { error: updateError } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', initialData.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('questions')
        .insert([payload])
      error = insertError
    }

    setLoading(false)

    if (error) {
      alert(`保存失败: ${error.message}`)
    } else {
      router.push('/admin/questions')
      router.refresh()
    }
  }

  function updateOption(id: string, content: string) {
    setForm(f => ({
      ...f,
      options: f.options.map(o => (o.id === id ? { ...o, content } : o)),
    }))
  }

  function addTag(tag: string) {
    const t = tag.trim()
    if (t && !form.knowledge_points.includes(t)) {
      setForm(f => ({ ...f, knowledge_points: [...f.knowledge_points, t] }))
    }
    setTagInput('')
    setShowTagDialog(false)
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, knowledge_points: f.knowledge_points.filter(t => t !== tag) }))
  }

  const groupedChapters = chapters.reduce((acc, ch) => {
    if (!acc[ch.subject]) acc[ch.subject] = []
    acc[ch.subject].push(ch)
    return acc
  }, {} as Record<string, Chapter[]>)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基础信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 题目类型 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {([
              ['choice', '选择题'],
              ['fill', '填空题'],
              ['essay', '解答题'],
            ] as [QuestionType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: value }))}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.type === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 章节 */}
            <div className="space-y-2">
              <Label>
                章节 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.chapter_code}
                onValueChange={v => setForm(f => ({ ...f, chapter_code: v }))}
              >
                <SelectTrigger className={errors.chapter_code ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择章节" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedChapters).map(([subject, chs]) => (
                    <div key={subject}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        {subject}
                      </div>
                      {chs.map(ch => (
                        <SelectItem key={ch.code} value={ch.code}>
                          {ch.code} {ch.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {errors.chapter_code && (
                <p className="text-xs text-red-500">{errors.chapter_code}</p>
              )}
            </div>

            {/* 难度 */}
            <div className="space-y-2">
              <Label>难度</Label>
              <Select
                value={String(form.difficulty)}
                onValueChange={v => setForm(f => ({ ...f, difficulty: Number(v) as Difficulty }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">🟢 简单</SelectItem>
                  <SelectItem value="2">🟡 中等</SelectItem>
                  <SelectItem value="3">🔴 困难</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 来源 */}
            <div className="space-y-2">
              <Label>题目来源</Label>
              <Input
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                placeholder="如：2024年真题"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 题目内容 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">题目内容</CardTitle>
        </CardHeader>
        <CardContent>
          <LatexEditor
            value={form.content}
            onChange={v => setForm(f => ({ ...f, content: v }))}
            label="题目描述"
            required
            error={errors.content}
            minHeight={150}
          />
        </CardContent>
      </Card>

      {/* 选项 (选择题专用) */}
      {form.type === 'choice' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">选项设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              点击选项前的字母可设置该选项为正确答案
            </p>
            {errors.options && (
              <p className="text-xs text-red-500">{errors.options}</p>
            )}
            <div className="space-y-3">
              {form.options.map(option => (
                <div key={option.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, answer: option.id }))}
                    className={`mt-2 w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 flex items-center justify-center transition-colors ${
                      form.answer === option.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary/20'
                    }`}
                  >
                    {option.id}
                  </button>
                  <div className="flex-1">
                    <LatexEditor
                      value={option.content}
                      onChange={v => updateOption(option.id, v)}
                      placeholder={`选项 ${option.label} 内容`}
                      minHeight={60}
                    />
                  </div>
                </div>
              ))}
            </div>
            {form.answer && (
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ 已设置正确答案为：{form.answer}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 答案 (填空/解答) */}
      {form.type !== 'choice' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">答案</CardTitle>
          </CardHeader>
          <CardContent>
            <LatexEditor
              value={form.answer}
              onChange={v => setForm(f => ({ ...f, answer: v }))}
              required
              error={errors.answer}
              minHeight={80}
              label="标准答案"
            />
          </CardContent>
        </Card>
      )}

      {/* 解析 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">解析与知识点</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <LatexEditor
              value={form.explanation}
              onChange={v => setForm(f => ({ ...f, explanation: v }))}
              minHeight={100}
              label="题目解析"
            />
          </div>

          {/* 知识点标签 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>知识点标签</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTagDialog(true)}
              >
                + 新建标签
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {form.knowledge_points.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无标签</p>
              )}
              {form.knowledge_points.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground">快速添加：</span>
              {['函数极限', '导数', '积分', '微分方程', '矩阵', '行列式', '向量', '概率'].map(
                tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={form.knowledge_points.includes(tag)}
                    className="text-xs px-2 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-600 hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + {tag}
                  </button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提交 */}
      <div className="flex gap-3 justify-end pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/questions')}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : isEdit ? '保存修改' : '创建题目'}
        </Button>
      </div>

      {/* 新建标签对话框 */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加知识点标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="输入标签名称"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              常见标签：函数极限、导数、积分、微分方程、矩阵、行列式、向量、概率
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              取消
            </Button>
            <Button onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
