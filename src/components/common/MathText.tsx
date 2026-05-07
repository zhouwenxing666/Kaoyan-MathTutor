'use client'

import { useMemo } from 'react'
import katex from 'katex'

interface MathTextProps {
  content: string
  className?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 把字符串拆成 [文本片段, 公式片段, 文本片段, ...]，逐段渲染。
// 支持 $$...$$（块）、$...$（行内）、\(...\)（行内）、\[...\]（块）
type Segment = { type: 'text' | 'inline' | 'block'; value: string }

function tokenize(input: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  let buf = ''
  const flushText = () => {
    if (buf) {
      segments.push({ type: 'text', value: buf })
      buf = ''
    }
  }

  while (i < input.length) {
    // 转义 $: \$ 当作普通字符
    if (input[i] === '\\' && input[i + 1] === '$') {
      buf += '$'
      i += 2
      continue
    }
    // 块级 $$...$$
    if (input.startsWith('$$', i)) {
      const end = input.indexOf('$$', i + 2)
      if (end !== -1) {
        flushText()
        segments.push({ type: 'block', value: input.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    // 行内 $...$
    if (input[i] === '$') {
      const end = input.indexOf('$', i + 1)
      if (end !== -1) {
        flushText()
        segments.push({ type: 'inline', value: input.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    // 块级 \[...\]
    if (input.startsWith('\\[', i)) {
      const end = input.indexOf('\\]', i + 2)
      if (end !== -1) {
        flushText()
        segments.push({ type: 'block', value: input.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    // 行内 \(...\)
    if (input.startsWith('\\(', i)) {
      const end = input.indexOf('\\)', i + 2)
      if (end !== -1) {
        flushText()
        segments.push({ type: 'inline', value: input.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    buf += input[i]
    i++
  }
  flushText()
  return segments
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode })
  } catch {
    return escapeHtml(tex)
  }
}

function MathText({ content, className = '' }: MathTextProps) {
  const html = useMemo(() => {
    const segs = tokenize(content)
    return segs
      .map((s) => {
        if (s.type === 'text') return escapeHtml(s.value).replace(/\n/g, '<br/>')
        return renderMath(s.value, s.type === 'block')
      })
      .join('')
  }, [content])

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export { MathText }
export default MathText
