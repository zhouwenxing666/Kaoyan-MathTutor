import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSM2, mapAnswerToQuality } from '@/lib/sm2'
import type { APIResponse, SessionType } from '@/types'

type AnswerRequest = {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  timeSpentSeconds: number | null
  sessionType: SessionType
}

type AnswerResponse = {
  newLevel: 1 | 2 | 3 | 4 | 5
  nextReviewAt: string
  knowledgePointId: number | null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json<APIResponse<null>>({ data: null, error: '未授权' }, { status: 401 })
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

  const { questionId, userAnswer, isCorrect, timeSpentSeconds, sessionType } = body

  // 1. 写入 answer_logs
  const { error: logError } = await supabase.from('answer_logs').insert({
    user_id: user.id,
    question_id: questionId,
    user_answer: userAnswer,
    is_correct: isCorrect,
    time_spent_seconds: timeSpentSeconds,
    session_type: sessionType,
  })

  if (logError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: logError.message },
      { status: 500 }
    )
  }

  // 2. 若答错，upsert wrong_questions
  if (!isCorrect) {
    await supabase.from('wrong_questions').upsert(
      { user_id: user.id, question_id: questionId, is_resolved: false },
      { onConflict: 'user_id,question_id', ignoreDuplicates: false }
    )
  }

  // 3. 获取题目的知识点 ID
  const { data: question } = await supabase
    .from('questions')
    .select('knowledge_point_id')
    .eq('id', questionId)
    .single()

  const knowledgePointId = question?.knowledge_point_id ?? null

  if (!knowledgePointId) {
    return NextResponse.json<APIResponse<AnswerResponse>>({
      data: {
        newLevel: 1,
        nextReviewAt: new Date().toISOString(),
        knowledgePointId: null,
      },
      error: null,
    })
  }

  // 4. 计算 SM2 quality，更新 user_progress
  const quality = mapAnswerToQuality(isCorrect, timeSpentSeconds)

  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('knowledge_point_id', knowledgePointId)
    .single()

  const sm2Output = calculateSM2({
    easeFactor: existingProgress?.ease_factor ?? 2.5,
    intervalDays: existingProgress?.interval_days ?? 1,
    level: existingProgress?.level ?? 1,
    quality,
  })

  await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      knowledge_point_id: knowledgePointId,
      level: sm2Output.newLevel,
      ease_factor: sm2Output.newEaseFactor,
      interval_days: sm2Output.newIntervalDays,
      next_review_at: sm2Output.nextReviewAt.toISOString().split('T')[0],
      total_attempts: (existingProgress?.total_attempts ?? 0) + 1,
      correct_attempts: (existingProgress?.correct_attempts ?? 0) + (isCorrect ? 1 : 0),
    },
    { onConflict: 'user_id,knowledge_point_id' }
  )

  return NextResponse.json<APIResponse<AnswerResponse>>({
    data: {
      newLevel: sm2Output.newLevel,
      nextReviewAt: sm2Output.nextReviewAt.toISOString(),
      knowledgePointId,
    },
    error: null,
  })
}
