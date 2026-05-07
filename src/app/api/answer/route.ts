import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSM2, mapAnswerToQuality } from '@/lib/sm2'
import type { APIResponse, ProgressStatus } from '@/types'

type AnswerRequest = {
  questionId: string
  userAnswer: string
  timeSpentSeconds?: number | null
}

type AnswerResponse = {
  isCorrect: boolean
  correctAnswer: string | null
  explanation: string | null
  newLevel: 1 | 2 | 3 | 4 | 5
  nextReviewAt: string
  status: ProgressStatus
}

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

  let body: AnswerRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '请求体格式错误' },
      { status: 400 }
    )
  }

  const { questionId, userAnswer, timeSpentSeconds = null } = body

  if (!questionId || userAnswer === undefined) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '缺少必要参数' },
      { status: 400 }
    )
  }

  // 1. 拉题判断正确性（解答题以客户端自评为准 → 走 userAnswer 是 'correct'/'wrong'）
  const { data: question, error: qError } = await supabase
    .from('questions')
    .select('id, type, answer, explanation, chapter_code')
    .eq('id', questionId)
    .single()

  if (qError || !question) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '题目不存在' },
      { status: 404 }
    )
  }

  let isCorrect: boolean
  if (question.type === 'essay') {
    isCorrect = userAnswer === 'correct'
  } else {
    const a = (question.answer ?? '').trim().toLowerCase()
    const b = userAnswer.trim().toLowerCase()
    isCorrect = !!a && a === b
  }

  // 2. 写答题记录
  await supabase.from('answer_logs').insert({
    user_id: user.id,
    question_id: questionId,
    user_answer: userAnswer,
    is_correct: isCorrect,
    time_spent_seconds: timeSpentSeconds,
  })

  // 3. 计算 SM-2，更新 user_progress（key: user_id + question_id）
  const quality = mapAnswerToQuality(isCorrect, timeSpentSeconds)

  const { data: existing } = await supabase
    .from('user_progress')
    .select('id, ease_factor, interval, repetitions, times_correct, times_wrong')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .single()

  const sm2 = calculateSM2({
    easeFactor: existing?.ease_factor ?? 2.5,
    intervalDays: existing?.interval ?? 1,
    level: existing?.repetitions ?? 1,
    quality,
  })

  let status: ProgressStatus = 'learning'
  if (sm2.newLevel >= 4) status = 'mastered'

  if (existing) {
    await supabase
      .from('user_progress')
      .update({
        status,
        ease_factor: sm2.newEaseFactor,
        interval: sm2.newIntervalDays,
        repetitions: sm2.newLevel,
        next_review_at: sm2.nextReviewAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        times_correct: (existing.times_correct ?? 0) + (isCorrect ? 1 : 0),
        times_wrong: (existing.times_wrong ?? 0) + (isCorrect ? 0 : 1),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('user_progress').insert({
      user_id: user.id,
      question_id: questionId,
      chapter_code: question.chapter_code,
      status,
      ease_factor: sm2.newEaseFactor,
      interval: sm2.newIntervalDays,
      repetitions: sm2.newLevel,
      next_review_at: sm2.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      times_correct: isCorrect ? 1 : 0,
      times_wrong: isCorrect ? 0 : 1,
    })
  }

  return NextResponse.json<APIResponse<AnswerResponse>>({
    data: {
      isCorrect,
      correctAnswer: question.answer,
      explanation: question.explanation,
      newLevel: sm2.newLevel,
      nextReviewAt: sm2.nextReviewAt.toISOString(),
      status,
    },
    error: null,
  })
}
