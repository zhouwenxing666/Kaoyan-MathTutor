'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QuestionForm } from '@/components/admin/QuestionForm'
import Skeleton from '@/components/ui/skeleton'

export default function EditQuestionPage() {
  const params = useParams()
  const router = useRouter()
  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setQuestion(data)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">题目不存在</p>
        <button
          onClick={() => router.push('/admin/questions')}
          className="mt-4 text-sm text-primary hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑题目</h1>
        <p className="text-sm text-muted-foreground mt-1">修改题目信息</p>
      </div>
      <QuestionForm initialData={question} isEdit />
    </div>
  )
}
