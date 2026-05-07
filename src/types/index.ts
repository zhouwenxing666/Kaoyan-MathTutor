// =====================
// 数据库行类型（与 supabase-init.sql 实际部署的 Schema 对齐）
// =====================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export type UserProfile = {
  id: string
  email: string
  name: string | null
  target_school: string | null
  target_subject: string | null
  subscription_tier: SubscriptionTier
  daily_ai_quota: number
  created_at: string
  updated_at: string
}

export type Chapter = {
  id: number
  code: string
  name: string
  subject: string
  level: number
  total_questions: number
  created_at: string
}

export type QuestionType = 'choice' | 'fill' | 'essay'

// 选项在 DB 中以 JSONB 数组形式存储
export type QuestionOption = { id: 'A' | 'B' | 'C' | 'D'; content: string }

export type Question = {
  id: string
  type: QuestionType
  content: string
  options: QuestionOption[] | null
  answer: string | null
  explanation: string | null
  solution: string | null
  difficulty: number
  source: string | null
  chapter_code: string | null
  knowledge_points: string[] | null
  is_essay: boolean
  created_at: string
}

export type ProgressStatus = 'new' | 'learning' | 'mastered' | 'ignored'

export type UserProgress = {
  id: number
  user_id: string
  question_id: string
  chapter_code: string | null
  status: ProgressStatus
  ease_factor: number
  interval: number
  repetitions: number
  next_review_at: string | null
  last_reviewed_at: string | null
  times_correct: number
  times_wrong: number
  created_at: string
  updated_at: string
}

export type AnswerLog = {
  id: number
  user_id: string
  question_id: string
  user_answer: string | null
  is_correct: boolean
  time_spent_seconds: number | null
  created_at: string
}

export type AIConversation = {
  id: number
  user_id: string
  question_id: string | null
  user_message: string
  ai_response: string
  created_at: string
}

// =====================
// SM-2 算法
// =====================

export type SM2Input = {
  easeFactor: number
  intervalDays: number
  level: number
  quality: 0 | 1 | 2 | 3 | 4 | 5
}

export type SM2Output = {
  newEaseFactor: number
  newIntervalDays: number
  newLevel: 1 | 2 | 3 | 4 | 5
  nextReviewAt: Date
}

// =====================
// AI
// =====================

export type AIMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// =====================
// API 响应
// =====================

export type APIResponse<T> = {
  data: T | null
  error: string | null
}

export type DashboardStats = {
  todayQuestions: number
  todayCorrect: number
  streak: number
  toReview: number
  totalQuestions: number
  masteredQuestions: number
}
