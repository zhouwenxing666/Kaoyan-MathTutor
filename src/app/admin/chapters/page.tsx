import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminChaptersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">章节管理</h1>
        <p className="text-sm text-muted-foreground mt-1">管理课程章节信息</p>
      </div>
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">章节管理功能开发中...</p>
        <Link href="/admin/questions">
          <Button variant="outline">← 返回题目管理</Button>
        </Link>
      </div>
    </div>
  )
}
