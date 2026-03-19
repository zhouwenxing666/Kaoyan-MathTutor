import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component - ignore
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ questions: [], total: 0 }, { status: 200 })
  }

  // Get user's wrong question progress records (times_wrong > 0)
  const { data: progressData, error: progressError } = await supabase
    .from('user_progress')
    .select('question_id, chapter_code, times_wrong, updated_at')
    .eq('user_id', user.id)
    .gt('times_wrong', 0)
    .order('updated_at', { ascending: false })

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 })
  }

  if (!progressData || progressData.length === 0) {
    return NextResponse.json({ questions: [], total: 0 }, { status: 200 })
  }

  const questionIds = progressData.map((p) => p.question_id)
  const progressMap = new Map(progressData.map((p) => [p.question_id, p]))

  // Batch fetch question details
  const { data: questionsData, error: questionsError } = await supabase
    .from('questions')
    .select('id, content, options, answer, explanation, chapter_code')
    .in('id', questionIds)

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 })
  }

  if (!questionsData || questionsData.length === 0) {
    return NextResponse.json({ questions: [], total: 0 }, { status: 200 })
  }

  // Get chapter codes and fetch chapter names
  const chapterCodes = [...new Set(questionsData.map((q) => q.chapter_code))]
  const { data: chaptersData } = await supabase
    .from('chapters')
    .select('code, name')
    .in('code', chapterCodes)

  const chapterMap = new Map(chaptersData?.map((c) => [c.code, c.name]) ?? [])

  // Batch fetch latest wrong answer timestamps from answer_logs
  const { data: logsData } = await supabase
    .from('answer_logs')
    .select('question_id, created_at')
    .eq('user_id', user.id)
    .eq('is_correct', false)
    .in('question_id', questionIds)
    .order('created_at', { ascending: false })

  // Build map of latest wrong timestamp per question
  const lastWrongMap = new Map<string, string>()
  for (const log of logsData ?? []) {
    if (!lastWrongMap.has(log.question_id)) {
      lastWrongMap.set(log.question_id, log.created_at)
    }
  }

  // Build user answer map from answer_logs (latest answer per question)
  const { data: latestAnswersData } = await supabase
    .from('answer_logs')
    .select('question_id, user_answer')
    .eq('user_id', user.id)
    .in('question_id', questionIds)
    .order('created_at', { ascending: false })

  const latestAnswerMap = new Map<string, string>()
  for (const log of latestAnswersData ?? []) {
    if (!latestAnswerMap.has(log.question_id)) {
      latestAnswerMap.set(log.question_id, log.user_answer)
    }
  }

  // Transform to API response format
  const questions = questionsData.map((q) => {
    const progress = progressMap.get(q.id)!
    const chapterName = chapterMap.get(q.chapter_code) ?? q.chapter_code

    // Transform options array to { A, B, C, D } record
    let options: Record<'A' | 'B' | 'C' | 'D', string> | null = null
    if (q.options && Array.isArray(q.options) && q.options.length > 0) {
      options = { A: '', B: '', C: '', D: '' }
      for (const opt of q.options) {
        if (opt.id === 'A') options.A = opt.content
        else if (opt.id === 'B') options.B = opt.content
        else if (opt.id === 'C') options.C = opt.content
        else if (opt.id === 'D') options.D = opt.content
      }
    }

    return {
      id: q.id,
      chapterCode: q.chapter_code,
      chapterName,
      content: q.content,
      options,
      userAnswer: latestAnswerMap.get(q.id) ?? '',
      correctAnswer: q.answer,
      explanation: q.explanation ?? '',
      timesWrong: progress.times_wrong,
      lastWrongAt: lastWrongMap.get(q.id) ?? progress.updated_at,
    }
  })

  return NextResponse.json({ questions, total: questions.length }, { status: 200 })
}
