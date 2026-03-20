import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse } from '@/types'

type DashboardStats = {
  todayQuestions: number
  todayCorrect: number
  streak: number
  toReview: number
  totalQuestions: number
  masteredQuestions: number
}

// GET /api/stats - 获取用户统计数据（Dashboard 专用）
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. 从 user_stats 获取基础统计
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '获取统计数据失败' },
      { status: 500 }
    )
  }

  // 如果没有记录，初始化
  if (!existingStats) {
    const { error: insertError } = await supabase.from('user_stats').insert({
      user_id: user.id,
      email: user.email,
      mastered_count: 0,
      learning_count: 0,
      total_practiced: 0,
      today_questions: 0,
      today_correct: 0,
    })

    if (insertError) {
      return NextResponse.json<APIResponse<null>>(
        { data: null, error: '初始化用户统计失败' },
        { status: 500 }
      )
    }

    return NextResponse.json<APIResponse<DashboardStats>>({
      data: {
        todayQuestions: 0,
        todayCorrect: 0,
        streak: 0,
        toReview: 0,
        totalQuestions: 0,
        masteredQuestions: 0,
      },
      error: null,
    })
  }

  // 2. 计算连续打卡天数 (streak)
  const { data: recentLogs } = await supabase
    .from('answer_logs')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  let streak = 0
  if (recentLogs && recentLogs.length > 0) {
    const daySet = new Set(recentLogs.map((l) => l.created_at.split('T')[0]))
    const todayStr = today.toISOString().split('T')[0]

    if (daySet.has(todayStr)) {
      // 今天有答题
      streak = 1
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - 1)
      while (daySet.has(checkDate.toISOString().split('T')[0])) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    } else {
      // 今天没答题，检查昨天的连续天数
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - 1)
      while (daySet.has(checkDate.toISOString().split('T')[0])) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }
  }

  // 3. 计算待复习题目数 (toReview)
  const { count: toReview } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', today.toISOString())

  // 4. 检查是否需要重置今日统计（跨天后）
  const todayDate = new Date().toISOString().split('T')[0]
  const statsDate = existingStats.updated_at
    ? existingStats.updated_at.split('T')[0]
    : null

  let todayQuestions = existingStats.today_questions ?? 0
  let todayCorrect = existingStats.today_correct ?? 0

  if (statsDate !== todayDate) {
    // 重新计算今日统计（因为跨天后 user_stats 的 today_* 可能未更新）
    const { data: todayLogs } = await supabase
      .from('answer_logs')
      .select('is_correct')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    todayQuestions = todayLogs?.length ?? 0
    todayCorrect = todayLogs?.filter((l) => l.is_correct).length ?? 0

    // 更新 user_stats
    await supabase
      .from('user_stats')
      .update({
        today_questions: todayQuestions,
        today_correct: todayCorrect,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
  }

  // 5. 构建 camelCase 响应
  const stats: DashboardStats = {
    todayQuestions,
    todayCorrect,
    streak,
    toReview: toReview ?? 0,
    totalQuestions: existingStats.total_practiced ?? 0,
    masteredQuestions: existingStats.mastered_count ?? 0,
  }

  return NextResponse.json<APIResponse<DashboardStats>>({
    data: stats,
    error: null,
  })
}

// PUT /api/stats - 更新用户统计数据（由其他 API 调用，不直接暴露）
export async function PUT(request: NextRequest) {
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

  const body = await request.json()
  const { mastered_count, learning_count, total_practiced, today_questions, today_correct } =
    body

  const { data: updatedStats, error: updateError } = await supabase
    .from('user_stats')
    .update({
      mastered_count: mastered_count ?? 0,
      learning_count: learning_count ?? 0,
      total_practiced: total_practiced ?? 0,
      today_questions: today_questions ?? 0,
      today_correct: today_correct ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '更新统计数据失败' },
      { status: 500 }
    )
  }

  return NextResponse.json<APIResponse<typeof updatedStats>>({
    data: updatedStats,
    error: null,
  })
}
