import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSM2, mapAnswerToQuality } from '@/lib/sm2'
import type { APIResponse, DashboardStats } from '@/types'

// POST /api/progress - 提交答案
export async function POST(request: NextRequest) {
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
  const { questionId, answer, timeSpent } = body as {
    questionId: string
    answer: string
    timeSpent: number
  }

  if (!questionId || answer === undefined || typeof timeSpent !== 'number') {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '缺少必要参数: questionId, answer, timeSpent' },
      { status: 400 }
    )
  }

  // 1. 查询题目正确答案
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('id, answer, explanation, chapter_code')
    .eq('id', questionId)
    .single()

  if (questionError || !question) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '题目不存在' },
      { status: 404 }
    )
  }

  // 2. 判断是否正确（忽略前后空格）
  const isCorrect = question.answer.trim().toUpperCase() === answer.trim().toUpperCase()

  // 3. 计算 SM-2 quality
  const quality = mapAnswerToQuality(isCorrect, timeSpent)

  // 4. 查询用户现有进度（如有）
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .single()

  let newProgress: Record<string, unknown> = {}

  if (existingProgress) {
    // 已存在题目：更新进度
    const sm2Result = calculateSM2({
      easeFactor: existingProgress.ease_factor ?? 2.5,
      intervalDays: existingProgress.interval ?? 1,
      level: existingProgress.repetitions ?? 1,
      quality,
    })

    const newTimesCorrect = (existingProgress.times_correct ?? 0) + (isCorrect ? 1 : 0)
    const newTimesWrong = (existingProgress.times_wrong ?? 0) + (isCorrect ? 0 : 1)

    // 根据 SM-2 level 确定 status
    let status = 'learning'
    if (sm2Result.newLevel >= 4) status = 'mastered'
    else if (sm2Result.newLevel >= 2) status = 'learning'

    const { data: updatedProgress, error: updateError } = await supabase
      .from('user_progress')
      .update({
        status,
        ease_factor: sm2Result.newEaseFactor,
        interval: sm2Result.newIntervalDays,
        repetitions: sm2Result.newLevel,
        next_review_at: sm2Result.nextReviewAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        times_correct: newTimesCorrect,
        times_wrong: newTimesWrong,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingProgress.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json<APIResponse<null>>(
        { data: null, error: '更新进度失败' },
        { status: 500 }
      )
    }

    newProgress = {
      status,
      easeFactor: sm2Result.newEaseFactor,
      interval: sm2Result.newIntervalDays,
      repetitions: sm2Result.newLevel,
      nextReviewAt: sm2Result.nextReviewAt.toISOString(),
      timesCorrect: newTimesCorrect,
      timesWrong: newTimesWrong,
    }
  } else {
    // 新题目：插入新记录
    const sm2Result = calculateSM2({
      easeFactor: 2.5,
      intervalDays: 1,
      level: 1,
      quality,
    })

    let status = 'learning'
    if (sm2Result.newLevel >= 4) status = 'mastered'

    const { data: insertedProgress, error: insertError } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        question_id: questionId,
        chapter_code: question.chapter_code,
        status,
        ease_factor: sm2Result.newEaseFactor,
        interval: sm2Result.newIntervalDays,
        repetitions: sm2Result.newLevel,
        next_review_at: sm2Result.nextReviewAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        times_correct: isCorrect ? 1 : 0,
        times_wrong: isCorrect ? 0 : 1,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json<APIResponse<null>>(
        { data: null, error: '插入进度失败' },
        { status: 500 }
      )
    }

    newProgress = {
      status,
      easeFactor: sm2Result.newEaseFactor,
      interval: sm2Result.newIntervalDays,
      repetitions: sm2Result.newLevel,
      nextReviewAt: sm2Result.nextReviewAt.toISOString(),
      timesCorrect: isCorrect ? 1 : 0,
      timesWrong: isCorrect ? 0 : 1,
    }
  }

  // 5. 记录到 answer_logs 表
  const { error: logError } = await supabase.from('answer_logs').insert({
    user_id: user.id,
    question_id: questionId,
    user_answer: answer,
    is_correct: isCorrect,
    time_spent_seconds: timeSpent,
  })

  if (logError) {
    console.error('记录答题日志失败:', logError)
  }

  // 6. 更新/初始化 user_stats
  await ensureUserStats(supabase, user.id)

  return NextResponse.json<APIResponse<{
    correct: boolean
    explanation: string
    newProgress: Record<string, unknown>
  }>>({
    data: {
      correct: isCorrect,
      explanation: question.explanation ?? '',
      newProgress,
    },
    error: null,
  })
}

// GET /api/progress - 获取用户进度概览
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 今日答题数和正确率
  const { data: todayLogs } = await supabase
    .from('answer_logs')
    .select('is_correct')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  const todayCount = todayLogs?.length ?? 0
  const todayCorrect = todayLogs?.filter((l) => l.is_correct).length ?? 0
  const todayCorrectRate = todayCount > 0 ? todayCorrect / todayCount : 0

  // 连续打卡天数
  const { data: recentLogs } = await supabase
    .from('answer_logs')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  let streakDays = 0
  if (recentLogs && recentLogs.length > 0) {
    const daySet = new Set(recentLogs.map((l) => l.created_at.split('T')[0]))
    const checkDate = new Date(today)
    // 今天有答题才算 streak
    if (daySet.has(today.toISOString().split('T')[0])) {
      streakDays = 1
      checkDate.setDate(checkDate.getDate() - 1)
      while (daySet.has(checkDate.toISOString().split('T')[0])) {
        streakDays++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    } else {
      // 检查昨天是否开始 streak
      checkDate.setDate(checkDate.getDate() - 1)
      while (daySet.has(checkDate.toISOString().split('T')[0])) {
        streakDays++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }
  }

  // 今日待复习题目数
  const { count: reviewCount } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', today.toISOString())

  // 各章节信息
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, code, name, subject, level, total_questions')
    .order('level', { ascending: true })

  // 用户学习进度（按 question_id）
  const { data: progressRows } = await supabase
    .from('user_progress')
    .select('question_id, chapter_code, repetitions, status, times_correct, times_wrong')
    .eq('user_id', user.id)

  // 按 chapter_code 聚合
  type ProgressAgg = { total: number; correct: number; levelSum: number; count: number; mastered: number }
  const chapterAgg: Record<string, ProgressAgg> = {}

  for (const row of progressRows ?? []) {
    const code = row.chapter_code ?? 'unknown'
    if (!chapterAgg[code]) {
      chapterAgg[code] = { total: 0, correct: 0, levelSum: 0, count: 0, mastered: 0 }
    }
    chapterAgg[code].total += 1
    chapterAgg[code].correct += row.times_correct ?? 0
    chapterAgg[code].levelSum += row.repetitions ?? 1
    chapterAgg[code].count++
    if (row.status === 'mastered') chapterAgg[code].mastered++
  }

  const chaptersWithProgress = (chapters ?? []).map((c) => ({
    ...c,
    progress: chapterAgg[c.code]
      ? {
          total: chapterAgg[c.code].total,
          correct: chapterAgg[c.code].correct,
          level_avg:
            chapterAgg[c.code].count > 0
              ? chapterAgg[c.code].levelSum / chapterAgg[c.code].count
              : 0,
          mastered: chapterAgg[c.code].mastered,
        }
      : undefined,
  }))

  const stats: DashboardStats = {
    today_count: todayCount,
    today_correct_rate: todayCorrectRate,
    streak_days: streakDays,
    review_count: reviewCount ?? 0,
    chapters: chaptersWithProgress as unknown as DashboardStats['chapters'],
  }

  return NextResponse.json<APIResponse<DashboardStats>>({ data: stats, error: null })
}

// 确保用户 stats 记录存在
async function ensureUserStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: existing } = await supabase
    .from('user_stats')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    // 更新统计
    const { data: todayStats } = await supabase
      .from('answer_logs')
      .select('is_correct')
      .eq('user_id', userId)
      .gte('created_at', new Date().toISOString().split('T')[0])

    const todayCount = todayStats?.length ?? 0
    const todayCorrect = todayStats?.filter((l) => l.is_correct).length ?? 0

    const { data: totalStats } = await supabase
      .from('answer_logs')
      .select('is_correct')
      .eq('user_id', userId)

    const totalPracticed = totalStats?.length ?? 0

    const { count: masteredCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'mastered')

    const { count: learningCount } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'learning')

    await supabase
      .from('user_stats')
      .update({
        total_practiced: totalPracticed,
        today_questions: todayCount,
        today_correct: todayCorrect,
        mastered_count: masteredCount ?? 0,
        learning_count: learningCount ?? 0,
      })
      .eq('user_id', userId)
  } else {
    // 创建初始记录
    await supabase.from('user_stats').insert({
      user_id: userId,
      mastered_count: 0,
      learning_count: 0,
      total_practiced: 0,
      today_questions: 0,
      today_correct: 0,
    })
  }
}
