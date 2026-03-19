'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { MathText } from '@/components/common/MathText'

type Question = {
  id: string
  type: string
  content: string
  answer: string
  difficulty: number
  chapter_code: string
  knowledge_points: string[]
  created_at: string
}

const TYPE_MAP: Record<string, string> = {
  choice: '选择题',
  fill: '填空题',
  essay: '解答题',
}

const DIFFICULTY_MAP: Record<number, string> = {
  1: '简单',
  2: '中等',
  3: '困难',
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setQuestions(data as Question[])
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('questions').delete().eq('id', deleteId)
    if (!error) {
      setQuestions(qs => qs.filter(q => q.id !== deleteId))
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const filtered = questions.filter(q => {
    const matchSearch = !search || q.content.includes(search) || q.chapter_code?.includes(search)
    const matchType = typeFilter === 'all' || q.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">题目管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {questions.length} 道题目</p>
        </div>
        <Link href="/admin/questions/new">
          <Button>+ 新增题目</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="搜索题目内容..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="题目类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="choice">选择题</SelectItem>
            <SelectItem value="fill">填空题</SelectItem>
            <SelectItem value="essay">解答题</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">类型</TableHead>
                <TableHead>题目内容</TableHead>
                <TableHead className="w-20">难度</TableHead>
                <TableHead className="w-24">章节</TableHead>
                <TableHead>知识点</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    没有找到题目
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(q => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Badge variant="outline">{TYPE_MAP[q.type] || q.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="line-clamp-2 text-sm">
                        <MathText content={q.content} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          q.difficulty === 1
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : q.difficulty === 2
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }
                      >
                        {DIFFICULTY_MAP[q.difficulty] || q.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{q.chapter_code}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(q.knowledge_points || []).slice(0, 3).map((kp: string) => (
                          <Badge key={kp} variant="secondary" className="text-xs">
                            {kp}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/questions/${q.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            编辑
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setDeleteId(q.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除这道题目吗？此操作不可撤销。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
