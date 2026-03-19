// =====================
// 数据库行类型
// =====================

export type Subject = {
  id: number
  code: 'math1' | 'math2' | 'math3'
  name: string
}

export type Chapter = {
  id: number
  subject_id: number
  code: string
  name: string
  display_order: number
}

export type KnowledgePoint = {
  id: number
  chapter_id: number
  code: string
  name: string
  description: string | null
  importance: 'high' | 'medium' | 'low'
}

// =====================
// 题目相关类型
// =====================

export type QuestionType = 'choice' | 'fill' | 'essay'
export type PoolType = 'training' | 'mock'
export type QuestionSource = 'real_exam' | 'liyongle_adv' | 'original'

export type Question = {
  id: string
  subject_id: number
  chapter_id: number
  knowledge_point_id: number | null
  type: QuestionType
  content: string
  options: Record<'A' | 'B' | 'C' | 'D', string> | null
  answer: string
  solution: string | null
  source: QuestionSource
  year: number | null
  pool_type: PoolType | null
  difficulty: number
  is_published: boolean
  created_at: string
}

// =====================
// 用户相关类型
// =====================

export type SubscriptionTier = 'free' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime'

export type UserProfile = {
  id: string
  nickname: string | null
  avatar_url: string | null
  subject_id: number | null
  target_year: number | null
  daily_goal_minutes: number
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

// =====================
// 学习进度类型 (SM-2)
// =====================

export type UserProgress = {
  id: string
  user_id: string
  knowledge_point_id: number
  level: 1 | 2 | 3 | 4 | 5
  ease_factor: number
  interval_days: number
  next_review_at: string
  total_attempts: number
  correct_attempts: number
}

// SM-2 算法输入/输出
export type SM2Input = {
  easeFactor: number
  intervalDays: number
  level: number
  quality: 0 | 1 | 2 | 3 | 4 | 5 // 0-1=错误, 2=困难, 3=良好, 4=较好, 5=完美
}

export type SM2Output = {
  newEaseFactor: number
  newIntervalDays: number
  newLevel: 1 | 2 | 3 | 4 | 5
  nextReviewAt: Date
}

// =====================
// 答题记录类型
// =====================

export type SessionType = 'train' | 'review' | 'mock'

export type AnswerLog = {
  id: string
  user_id: string
  question_id: string
  user_answer: string | null
  is_correct: boolean
  time_spent_seconds: number | null
  session_type: SessionType
  answered_at: string
}

// =====================
// 错题本类型
// =====================

export type WrongQuestion = {
  id: string
  user_id: string
  question_id: string
  added_at: string
  is_resolved: boolean
  notes: string | null
}

// =====================
// AI 相关类型
// =====================

export type AIModel = 'glm-4-flash' | 'deepseek-reasoner'

export type AIMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type AIConversation = {
  id: string
  user_id: string
  question_id: string | null
  model_used: AIModel
  user_message: string
  ai_response: string | null
  created_at: string
}

// =====================
// API 响应类型
// =====================

export type APIResponse<T> = {
  data: T | null
  error: string | null
}

// =====================
// 页面组件用类型
// =====================

export type QuestionWithChapter = Question & {
  chapter?: Chapter
  knowledge_point?: KnowledgePoint
}

export type ChapterWithProgress = Chapter & {
  progress?: {
    total: number
    correct: number
    level_avg: number
  }
}

export type DashboardStats = {
  today_count: number
  today_correct_rate: number
  streak_days: number
  review_count: number
  chapters: ChapterWithProgress[]
}
