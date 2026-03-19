import { QuestionForm } from '@/components/admin/QuestionForm'

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新增题目</h1>
        <p className="text-sm text-muted-foreground mt-1">
          填写题目信息，支持 LaTeX 数学公式
        </p>
      </div>
      <QuestionForm />
    </div>
  )
}
