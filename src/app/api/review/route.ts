import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse, Question } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '未授权' },
      { status: 401 }
    )
  }

  const now = new Date().toISOString()

  // 取出 next_review_at <= now 的题目（兼容 next_review_at IS NULL 的新题，不包含已掌握）
  const { data: due, error: dueError } = await supabase
    .from('user_progress')
    .select('question_id, chapter_code, next_review_at, status')
    .eq('user_id', user.id)
    .neq('status', 'mastered')
    .neq('status', 'ignored')
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(50)

  if (dueError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: dueError.message },
      { status: 500 }
    )
  }

  if (!due || due.length === 0) {
    return NextResponse.json<APIResponse<{ questions: Question[]; chapterMap: Record<string, string> }>>({
      data: { questions: [], chapterMap: {} },
      error: null,
    })
  }

  const questionIds = due.map((d) => d.question_id)

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select(
      'id, type, content, options, answer, explanation, solution, difficulty, source, chapter_code, knowledge_points, is_essay, created_at'
    )
    .in('id', questionIds)

  if (qError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: qError.message },
      { status: 500 }
    )
  }

  const chapterCodes = [...new Set((questions ?? []).map((q) => q.chapter_code).filter(Boolean))]
  const { data: chapters } = await supabase
    .from('chapters')
    .select('code, name')
    .in('code', chapterCodes)

  const chapterMap: Record<string, string> = {}
  for (const c of chapters ?? []) chapterMap[c.code] = c.name

  // 按 due 的顺序排序题目
  const idOrder = new Map(questionIds.map((id, idx) => [id, idx]))
  const ordered = (questions ?? []).slice().sort(
    (a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0)
  )

  return NextResponse.json<APIResponse<{ questions: Question[]; chapterMap: Record<string, string> }>>({
    data: { questions: ordered as Question[], chapterMap },
    error: null,
  })
}
