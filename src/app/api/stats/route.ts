import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse } from '@/types'

// GET /api/stats - 获取用户统计数据（首次访问时自动初始化）
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

  // 检查用户是否存在于 user_stats
  const { data: existingStats, error: fetchError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned, 其他错误则返回
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '获取统计数据失败' },
      { status: 500 }
    )
  }

  // 如果没有记录，自动初始化
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

    // 重新获取初始化后的数据
    const { data: newStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json<APIResponse<typeof newStats>>({
      data: newStats,
      error: null,
    })
  }

  // 检查是否需要重置今日统计（跨天后）
  const today = new Date().toISOString().split('T')[0]
  const statsDate = existingStats.updated_at
    ? existingStats.updated_at.split('T')[0]
    : null

  if (statsDate !== today) {
    // 重置今日统计
    const { error: updateError } = await supabase
      .from('user_stats')
      .update({
        today_questions: 0,
        today_correct: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (!updateError) {
      existingStats.today_questions = 0
      existingStats.today_correct = 0
    }
  }

  return NextResponse.json<APIResponse<typeof existingStats>>({
    data: existingStats,
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
