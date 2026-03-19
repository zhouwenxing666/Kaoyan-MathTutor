import type { SM2Input, SM2Output } from '@/types'

/**
 * SM-2 间隔重复算法实现
 * 
 * 算法原理：
 * - quality: 答题质量 (0-5)
 *   - 0-1: 完全错误
 *   - 2: 困难，需要很多提示
 *   - 3: 良好，有一些犹豫
 *   - 4: 较好，基本正确
 *   - 5: 完美，完全正确且快速
 * 
 * - easeFactor: 难度因子，初始2.5，最小1.3
 * - intervalDays: 下次复习间隔天数
 */

export function calculateSM2(input: SM2Input): SM2Output {
  const { easeFactor, intervalDays, level, quality } = input

  let newEaseFactor = easeFactor
  let newIntervalDays: number
  let newLevel: 1 | 2 | 3 | 4 | 5

  if (quality < 3) {
    // 答错：重置间隔，难度降低
    newIntervalDays = 1
    newLevel = Math.max(1, level - 1) as 1 | 2 | 3 | 4 | 5
    newEaseFactor = Math.max(1.3, easeFactor - 0.2)
  } else {
    // 答对：增加间隔，难度可能提升
    if (intervalDays === 1) {
      newIntervalDays = 6
    } else if (intervalDays === 6) {
      newIntervalDays = Math.round(intervalDays * easeFactor)
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor)
    }

    // 根据答题质量调整难度因子
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    newEaseFactor = Math.max(1.3, newEaseFactor)

    // 根据间隔天数确定新的level
    if (newIntervalDays <= 1) {
      newLevel = 1
    } else if (newIntervalDays <= 3) {
      newLevel = 2
    } else if (newIntervalDays <= 7) {
      newLevel = 3
    } else if (newIntervalDays <= 21) {
      newLevel = 4
    } else {
      newLevel = 5
    }
  }

  // 计算下次复习日期
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newIntervalDays)

  return {
    newEaseFactor,
    newIntervalDays,
    newLevel,
    nextReviewAt
  }
}

/**
 * 根据答题结果映射 SM-2 quality
 */
export function mapAnswerToQuality(
  isCorrect: boolean,
  timeSpentSeconds: number | null
): 0 | 1 | 2 | 3 | 4 | 5 {
  if (!isCorrect) {
    return 1 // 错误
  }

  if (timeSpentSeconds === null) {
    return 3 // 无时间信息，默认为良好
  }

  // 假设一道题合理时间是 60-180 秒
  // 快速正确 = 5，较慢但正确 = 3
  if (timeSpentSeconds < 60) {
    return 5 // 完美
  } else if (timeSpentSeconds < 120) {
    return 4 // 较好
  } else if (timeSpentSeconds < 180) {
    return 3 // 良好
  } else {
    return 2 // 较慢
  }
}

/**
 * 根据用户自评映射 SM-2 quality (解答题用)
 */
export function mapSelfRatingToQuality(
  rating: 'perfect' | 'partial' | 'wrong'
): 5 | 3 | 1 {
  switch (rating) {
    case 'perfect':
      return 5
    case 'partial':
      return 3
    case 'wrong':
    default:
      return 1
  }
}

/**
 * 获取level的中文描述
 */
export function getLevelDescription(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 1:
      return '初识'
    case 2:
      return '理解'
    case 3:
      return '熟练'
    case 4:
      return '掌握'
    case 5:
      return '精通'
    default:
      return '未知'
  }
}

/**
 * 获取level的颜色
 */
export function getLevelColor(level: 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 1:
      return 'text-red-500'
    case 2:
      return 'text-orange-500'
    case 3:
      return 'text-yellow-500'
    case 4:
      return 'text-green-400'
    case 5:
      return 'text-green-600'
    default:
      return 'text-gray-500'
  }
}
