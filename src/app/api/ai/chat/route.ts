import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt, streamAIResponse } from '@/lib/ai'
import type { AIMessage } from '@/types'

const FREE_DAILY_QUOTA = 3

type ChatRequest = {
  messages: AIMessage[]
  questionId?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ data: null, error: '未授权' }, { status: 401 })
  }

  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: '请求体格式错误' }, { status: 400 })
  }

  const { messages, questionId } = body

  // 每日配额检查（免费用户限 3 次）
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const isFree = !profile || profile.subscription_tier === 'free'

  if (isFree) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count } = await supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if ((count ?? 0) >= FREE_DAILY_QUOTA) {
      return NextResponse.json(
        { data: null, error: `免费用户每日 AI 对话限 ${FREE_DAILY_QUOTA} 次，今日已达上限` },
        { status: 429 }
      )
    }
  }

  // 获取题目信息（可选）
  let question = null
  if (questionId) {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()
    question = data
  }

  // 构建系统提示词，合并到消息列表
  const systemPrompt = buildSystemPrompt(question, null, [])
  const apiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ]

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAIResponse(apiMessages, 'deepseek-chat')) {
          fullResponse += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        // 保存对话记录
        const userMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
        await supabase.from('ai_conversations').insert({
          user_id: user.id,
          question_id: questionId ?? null,
          user_message: userMessage,
          ai_response: fullResponse,
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '未知错误'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
