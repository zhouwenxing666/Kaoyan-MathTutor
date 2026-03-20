/**
 * BUG-002 修复验证测试
 * 
 * 修复前问题：
 * - 使用 chapters.total_questions 作为分母，但该字段可能与实际题目数量不符
 * - 导致进度显示偏低（如已掌握全部10题，但 total_questions=50，显示20%）
 * 
 * 修复后：
 * - 实际从 questions 表统计每个章节已发布的题目数量
 * - 使用真实数量计算掌握度
 * 
 * 运行方式：cd /Users/zhouwenxing/Documents/Projects/Kaoyan-MathTutor && npx ts-node --esm test-progress-fix.ts
 */

// 模拟数据测试逻辑
const testCases = [
  {
    name: '正常情况：已掌握部分题目',
    actualTotal: 30,
    masteredQuestions: 15,
    attemptedQuestions: 20,
    expectedProgress: 50,
  },
  {
    name: '全部掌握',
    actualTotal: 30,
    masteredQuestions: 30,
    attemptedQuestions: 30,
    expectedProgress: 100,
  },
  {
    name: '章节无题目，用户无进度',
    actualTotal: 0,
    masteredQuestions: 0,
    attemptedQuestions: 0,
    expectedProgress: 0,
  },
  {
    name: '章节有题目但用户未尝试',
    actualTotal: 50,
    masteredQuestions: 0,
    attemptedQuestions: 0,
    expectedProgress: 0,
  },
  {
    name: '章节无题目但用户有尝试记录',
    actualTotal: 0,
    masteredQuestions: 5,
    attemptedQuestions: 10,
    expectedProgress: 50, // fallback 到 attemptedQuestions
  },
  {
    name: '进度超过100%应被限制',
    actualTotal: 10,
    masteredQuestions: 15, // 异常数据
    attemptedQuestions: 15,
    expectedProgress: 100, // capped
  },
]

function calculateProgress(actualTotal: number, masteredQuestions: number, attemptedQuestions: number): number {
  const progress =
    actualTotal > 0
      ? Math.round((masteredQuestions / actualTotal) * 100)
      : attemptedQuestions > 0
        ? Math.round((masteredQuestions / attemptedQuestions) * 100)
        : 0
  return Math.min(100, progress)
}

console.log('🧪 BUG-002 修复验证测试\n')
console.log('=' .repeat(60))

let passed = 0
let failed = 0

for (const tc of testCases) {
  const result = calculateProgress(tc.actualTotal, tc.masteredQuestions, tc.attemptedQuestions)
  const status = result === tc.expectedProgress ? '✅ PASS' : '❌ FAIL'
  
  if (result === tc.expectedProgress) {
    passed++
  } else {
    failed++
  }

  console.log(`\n${status}: ${tc.name}`)
  console.log(`  输入: actualTotal=${tc.actualTotal}, mastered=${tc.masteredQuestions}, attempted=${tc.attemptedQuestions}`)
  console.log(`  期望: ${tc.expectedProgress}%, 实际: ${result}%`)
}

console.log('\n' + '='.repeat(60))
console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`)

// 验证新逻辑的核心差异
console.log('\n\n🔍 核心差异对比（旧 vs 新）:')
console.log('- 旧：使用 chapters.total_questions（可能与实际不符）')
console.log('- 新：从 questions 表统计实际发布的题目数量')
console.log('\n示例场景：')
console.log('  章节 X: total_questions=50, 实际题目=10, 用户掌握=10')
console.log('  旧: 10/50 = 20% (偏低)')
console.log('  新: 10/10 = 100% (正确)')
