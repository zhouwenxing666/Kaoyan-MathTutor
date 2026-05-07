import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { APIResponse } from '@/types'

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

  // 获取所有章节（按 subject 和 level 排序）
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, code, name, subject, level')
    .order('subject', { ascending: true })
    .order('level', { ascending: true })

  if (chaptersError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '获取章节列表失败' },
      { status: 500 }
    )
  }

  if (!chapters || chapters.length === 0) {
    return NextResponse.json<APIResponse<{
      chapters: any[]
      bySubject: any[]
    }>>({
      data: { chapters: [], bySubject: [] },
      error: null,
    })
  }

  const chapterCodes = chapters.map((c) => c.code)

  // 获取各章节实际发布的题目数量
  const { data: questionCounts, error: qCountError } = await supabase
    .from('questions')
    .select('chapter_code')
    .in('chapter_code', chapterCodes)

  if (qCountError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '获取题目数量失败' },
      { status: 500 }
    )
  }

  // 聚合实际题目数量
  const actualQuestionCount: Record<string, number> = {}
  for (const q of questionCounts ?? []) {
    if (q.chapter_code) {
      actualQuestionCount[q.chapter_code] = (actualQuestionCount[q.chapter_code] ?? 0) + 1
    }
  }

  // 获取用户所有进度记录
  const { data: progressRows, error: progressError } = await supabase
    .from('user_progress')
    .select('question_id, chapter_code, repetitions, status, times_correct, times_wrong')
    .eq('user_id', user.id)

  if (progressError) {
    return NextResponse.json<APIResponse<null>>(
      { data: null, error: '获取用户进度失败' },
      { status: 500 }
    )
  }

  // 按 chapter_code 聚合进度数据
  type ChapterProgress = {
    totalQuestions: number
    attemptedQuestions: number
    masteredQuestions: number
    correctAnswers: number
    totalAttempts: number
  }
  const chapterAgg: Record<string, ChapterProgress> = {}

  for (const row of progressRows ?? []) {
    const code = row.chapter_code ?? 'unknown'
    if (!chapterAgg[code]) {
      chapterAgg[code] = {
        totalQuestions: 0,
        attemptedQuestions: 0,
        masteredQuestions: 0,
        correctAnswers: 0,
        totalAttempts: 0,
      }
    }
    chapterAgg[code].attemptedQuestions++
    chapterAgg[code].correctAnswers += row.times_correct ?? 0
    chapterAgg[code].totalAttempts += (row.times_correct ?? 0) + (row.times_wrong ?? 0)
    if (row.status === 'mastered') {
      chapterAgg[code].masteredQuestions++
    }
  }

  // 组装返回数据
  const result = (chapters ?? []).map((chapter) => {
    const code = chapter.code
    const agg = chapterAgg[code]
    // 使用 questions 表中该章节实际题目数量作为分母
    const actualTotal = actualQuestionCount[code] ?? 0
    const attemptedQuestions = agg?.attemptedQuestions ?? 0

    // 计算掌握度：已掌握题目数 / 实际题目总数
    // 如果章节没有实际题目，则用尝试过的题目数估算掌握度
    const progress =
      actualTotal > 0
        ? Math.round(((agg?.masteredQuestions ?? 0) / actualTotal) * 100)
        : attemptedQuestions > 0
          ? Math.round(((agg?.masteredQuestions ?? 0) / attemptedQuestions) * 100)
          : 0

    return {
      code,
      name: chapter.name,
      subject: chapter.subject,
      totalQuestions: actualTotal, // 返回实际题目数量而非 chapters 表的 total_questions
      attemptedQuestions,
      masteredQuestions: agg?.masteredQuestions ?? 0,
      progress: Math.min(100, progress), // 最高不超过 100%
      // 额外信息
      _extra: {
        correctAnswers: agg?.correctAnswers ?? 0,
        totalAttempts: agg?.totalAttempts ?? 0,
      },
    }
  })

  // 按 subject 分组
  type SubjectGroup = {
    subject: string
    chapters: Omit<(typeof result)[0], '_extra'>[]
    totalQuestions: number
    attemptedQuestions: number
    masteredQuestions: number
    overallProgress: number
  }
  const groupedBySubject: Record<string, SubjectGroup> = {}

  for (const ch of result) {
    const subject = ch.subject ?? '其他'
    if (!groupedBySubject[subject]) {
      groupedBySubject[subject] = {
        subject,
        chapters: [],
        totalQuestions: 0,
        attemptedQuestions: 0,
        masteredQuestions: 0,
        overallProgress: 0,
      }
    }
    const { _extra, ...chData } = ch
    groupedBySubject[subject].chapters.push(chData)
    groupedBySubject[subject].totalQuestions += ch.totalQuestions
    groupedBySubject[subject].attemptedQuestions += ch.attemptedQuestions
    groupedBySubject[subject].masteredQuestions += ch.masteredQuestions
  }

  // 计算各 subject 的整体进度（修复：使用实际题目数量）
  for (const subject of Object.values(groupedBySubject)) {
    subject.overallProgress =
      subject.totalQuestions > 0
        ? Math.round((subject.masteredQuestions / subject.totalQuestions) * 100)
        : subject.attemptedQuestions > 0
          ? Math.round((subject.masteredQuestions / subject.attemptedQuestions) * 100)
          : 0
    subject.overallProgress = Math.min(100, subject.overallProgress)
  }

  return NextResponse.json<APIResponse<{
    chapters: Omit<(typeof result)[0], '_extra'>[]
    bySubject: SubjectGroup[]
  }>>({
    data: {
      chapters: result.map(({ _extra, ...rest }) => rest),
      bySubject: Object.values(groupedBySubject),
    },
    error: null,
  })
}
