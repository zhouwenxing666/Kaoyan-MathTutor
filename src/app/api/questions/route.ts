import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse, Question } from '@/types'

const FREE_DAILY_LIMIT = 5

// GET /api/questions?chapter=H01&type=choice&limit=10&exclude=id1,id2
export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl
  const chapter = searchParams.get('chapter')
  const type = searchParams.get('type')
  const limitParam = searchParams.get('limit')
  const exclude = searchParams.get('exclude')?.split(',').filter(Boolean) ?? []

  if (!chapter) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '缺少 chapter 参数' },
      { status: 400 }
    )
  }

  // 用户订阅信息
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const isFree = !profile || profile.subscription_tier === 'free'

  let limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10))) : 10

  // 免费用户：每章每日限 FREE_DAILY_LIMIT 题（基于今日答题日志）
  if (isFree) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 先查出该章节所有题目 id，再用 in 过滤 answer_logs
    const { data: chapterQs } = await supabase
      .from('questions')
      .select('id')
      .eq('chapter_code', chapter)

    const chapterQIds = (chapterQs ?? []).map((q) => q.id)

    let usedToday = 0
    if (chapterQIds.length > 0) {
      const { count } = await supabase
        .from('answer_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('question_id', chapterQIds)
        .gte('created_at', today.toISOString())
      usedToday = count ?? 0
    }

    const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday)
    if (remaining === 0) {
      return NextResponse.json<APIResponse<Question[]>>({
        data: [],
        error: '免费用户每章每日最多 5 题，今日已达上限',
      })
    }
    limit = Math.min(limit, remaining)
  }

  let query = supabase
    .from('questions')
    .select(
      'id, type, content, options, answer, explanation, solution, difficulty, source, chapter_code, knowledge_points, is_essay, created_at'
    )
    .eq('chapter_code', chapter)

  if (type) {
    query = query.eq('type', type)
  }

  if (exclude.length > 0) {
    query = query.not('id', 'in', `(${exclude.join(',')})`)
  }

  query = query.limit(limit).order('created_at', { ascending: true })

  const { data, error } = await query

  if (error) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<Question[]>>({
    data: (data ?? []) as Question[],
    error: null,
  })
}
