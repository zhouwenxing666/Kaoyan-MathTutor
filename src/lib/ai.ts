import { getSupabaseClient } from '@/lib/supabase/client'
import type { Question, UserProfile } from '@/types'

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 免费用户每日配额
const FREE_DAILY_QUOTA = 3

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

/**
 * 根据用户订阅等级获取可用的 AI 模型
 */
export function getModelForUser(tier: SubscriptionTier): string {
  switch (tier) {
    case 'enterprise':
      return 'deepseek-chat'
    case 'pro':
      return 'deepseek-chat'
    case 'free':
    default:
      return 'deepseek-chat'
  }
}

/**
 * 检查用户每日 AI 对话配额
 */
export async function checkDailyQuota(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
}> {
  const supabase = getSupabaseClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { count } = await supabase
    .from('ai_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  const used = count || 0
  const limit = FREE_DAILY_QUOTA
  const remaining = Math.max(0, limit - used)

  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
  }
}

/**
 * 构建 AI 助教系统提示词
 */
export function buildSystemPrompt(
  question: Question | null,
  userProfile: UserProfile | null,
  recentErrors: string[] = []
): string {
  const basePrompt = `你是考研数学 AI 助教，专门帮助考生理解数学概念、解答题目、分析错误。

背景信息：
- 用户：${userProfile?.name || '考生'}
- 科目：${userProfile?.targetSubject || '考研数学'}
- 目标院校：${userProfile?.targetSchool || '未定'}

指导原则：
1. 用通俗易懂的语言解释数学概念
2. 适当使用 LaTeX 公式渲染
3. 给出解题思路而不是直接给答案
4. 鼓励用户思考，引导发现问题所在
5. 总结涉及的知识点

`

  if (question) {
    return basePrompt + `
当前题目：
${question.content}

${question.options ? '选项：\n' + question.options.map(o => `${o.id}. ${o.content}`).join('\n') : ''}

请帮助用户：
1. 理解题目的考查点
2. 分析解题思路
3. 指出常见的错误陷阱
`
  }

  if (recentErrors.length > 0) {
    return basePrompt + `
用户最近出错的知识点：
${recentErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

请针对这些知识点进行巩固练习。
`
  }

  return basePrompt
}

/**
 * 调用 DeepSeek API 生成回复
 */
export async function generateAIResponse(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model: string = 'deepseek-chat'
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * 流式调用 DeepSeek API
 */
export async function* streamAIResponse(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  model: string = 'deepseek-chat'
): AsyncGenerator<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured')
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            return
          }
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * 记录 AI 对话
 */
export async function saveAIConversation(
  userId: string,
  questionId: string | null,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  const supabase = getSupabaseClient()

  await supabase.from('ai_conversations').insert({
    user_id: userId,
    question_id: questionId,
    user_message: userMessage,
    ai_response: aiResponse,
  })
}
