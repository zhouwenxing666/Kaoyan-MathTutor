import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse, Question } from '@/types'

const FREE_DAILY_LIMIT = 5

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<APIResponse<null>>({ data: null, error: '未授权' }, { status: 401 })
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

  // 获取章节 ID
  const { data: chapterData } = await supabase
    .from('chapters')
    .select('id')
    .eq('code', chapter)
    .single()

  if (!chapterData) {
    return NextResponse.json<APIResponse<Question[]>>({ data: [], error: null })
  }

  // 获取用户订阅信息
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const isFree = !profile || profile.subscription_tier === 'free'

  let limit = limitParam ? parseInt(limitParam, 10) : 10

  // 免费用户：检查今日本章节已做数量
  if (isFree) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('answer_logs')
      .select('*, questions!inner(chapter_id)', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('questions.chapter_id', chapterData.id)
      .gte('answered_at', today.toISOString())

    const usedToday = count ?? 0
    const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday)

    if (remaining === 0) {
      return NextResponse.json<APIResponse<Question[]>>({
        data: [],
        error: '免费用户每章每日最多 5 题，今日已达上限',
      })
    }

    limit = Math.min(limit, remaining)
  }

  // 查询题目
  let query = supabase
    .from('questions')
    .select('id, subject_id, chapter_id, knowledge_point_id, type, content, options, answer, solution, source, year, pool_type, difficulty, is_published, created_at')
    .eq('chapter_id', chapterData.id)
    .eq('is_published', true)

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

  return NextResponse.json<APIResponse<Question[]>>({ data: (data ?? []) as Question[], error: null })
}
