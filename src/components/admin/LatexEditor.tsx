'use client'

import { useState, useCallback } from 'react'
import { MathText } from '@/components/common/MathText'

interface LatexEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  minHeight?: number
}

export function LatexEditor({
  value,
  onChange,
  placeholder = '输入内容（支持 LaTeX 公式，用 $...$ 包裹）',
  label,
  required,
  error,
  minHeight = 120,
}: LatexEditorProps) {
  const [preview, setPreview] = useState(true)

  const insertMath = useCallback(
    (wrap: 'inline' | 'block') => {
      const textarea = document.querySelector('textarea[data-latex-editor]') as HTMLTextAreaElement
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = value.substring(start, end)
      const math = selected || (wrap === 'inline' ? 'x^2' : '\\frac{a}{b}')

      const wrapped = wrap === 'inline' ? `$${math}$` : `\n$$\n${math}\n$$\n`
      const newValue = value.substring(0, start) + wrapped + value.substring(end)
      onChange(newValue)

      setTimeout(() => {
        textarea.focus()
        const newCursor = start + (wrap === 'inline' ? math.length + 2 : math.length + 6)
        textarea.setSelectionRange(newCursor, newCursor)
      }, 0)
    },
    [value, onChange]
  )

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertMath('inline')}
              className="text-xs px-2 py-1 rounded border hover:bg-slate-50 dark:hover:bg-slate-800"
              title="插入行内公式"
            >
              $行内公式$
            </button>
            <button
              type="button"
              onClick={() => insertMath('block')}
              className="text-xs px-2 py-1 rounded border hover:bg-slate-50 dark:hover:bg-slate-800"
              title="插入块级公式"
            >
              $$ 块公式 $$
            </button>
            <button
              type="button"
              onClick={() => setPreview(p => !p)}
              className={`text-xs px-2 py-1 rounded border ${
                preview ? 'bg-slate-100 dark:bg-slate-800' : ''
              }`}
            >
              {preview ? '隐藏预览' : '显示预览'}
            </button>
          </div>
        </div>
      )}

      <textarea
        data-latex-editor
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
        }`}
        style={{ minHeight }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      {preview && value && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
          <p className="text-xs text-muted-foreground mb-2">预览：</p>
          <div className="text-sm">
            <MathText content={value} />
          </div>
        </div>
      )}
    </div>
  )
}
