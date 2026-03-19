'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathTextProps {
  content: string
  className?: string
}

/**
 * 数学公式渲染组件
 * 支持:
 * - 行内公式: $...$
 * - 块级公式: $$...$$
 */
export default function MathText({ content, className = '' }: MathTextProps) {
  const renderedContent = useMemo(() => {
    if (!content) return []

    const parts: Array<{
      type: 'text' | 'inline' | 'block'
      content: string
      key: string
    }> = []

    // 正则匹配块级公式 $$...$$ 和行内公式 $...$
    // 使用更精确的正则，避免匹配 $
    const blockRegex = /\$\$([\s\S]*?)\$\$/g
    const inlineRegex = /\$([^\$\n]+?)\$/g

    let lastIndex = 0
    let match
    let key = 0

    // 先处理块级公式
    const blockMatches: Array<{
      type: 'block'
      content: string
      start: number
      end: number
      key: string
    }> = []

    while ((match = blockRegex.exec(content)) !== null) {
      blockMatches.push({
        type: 'block',
        content: match[1].trim(),
        start: match.index,
        end: match.index + match[0].length,
        key: `block-${key++}`
      })
    }

    // 处理行内公式（在块级公式之外）
    const inlineMatches: Array<{
      type: 'inline'
      content: string
      start: number
      end: number
      key: string
    }> = []

    // 移除已匹配的块级公式后再匹配行内公式
    let tempContent = content
    let offset = 0

    // 简单处理：先分割块级公式，再在每段中找行内公式
    let remainingContent = content
    let currentIndex = 0

    const processBlock = (block: { type: 'block'; content: string; start: number; end: number; key: string }) => {
      // 添加块级公式前面的纯文本
      const beforeText = content.slice(currentIndex, block.start)
      if (beforeText) {
        // 在这段文本中找行内公式
        let inlineMatch
        const inlineRegexLocal = /\$([^\$\n]+?)\$/g
        let lastInlineIndex = 0
        while ((inlineMatch = inlineRegexLocal.exec(beforeText)) !== null) {
          // 添加行内公式前的文本
          if (inlineMatch.index > lastInlineIndex) {
            parts.push({
              type: 'text',
              content: beforeText.slice(lastInlineIndex, inlineMatch.index),
              key: `text-${key++}`
            })
          }
          // 添加行内公式
          parts.push({
            type: 'inline',
            content: inlineMatch[1],
            key: `inline-${key++}`
          })
          lastInlineIndex = inlineMatch.index + inlineMatch[0].length
        }
        // 添加剩余文本
        if (lastInlineIndex < beforeText.length) {
          parts.push({
            type: 'text',
            content: beforeText.slice(lastInlineIndex),
            key: `text-${key++}`
          })
        }
      }
      // 添加块级公式
      parts.push({
        type: 'block',
        content: block.content,
        key: block.key
      })
      currentIndex = block.end
    }

    // 按位置排序并处理所有块级公式
    blockMatches.sort((a, b) => a.start - b.start)
    blockMatches.forEach(processBlock)

    // 处理最后一个块级公式后的内容
    if (currentIndex < content.length) {
      const afterText = content.slice(currentIndex)
      let inlineMatch
      let lastInlineIndex = 0
      while ((inlineMatch = inlineRegex.exec(afterText)) !== null) {
        if (inlineMatch.index > lastInlineIndex) {
          parts.push({
            type: 'text',
            content: afterText.slice(lastInlineIndex, inlineMatch.index),
            key: `text-${key++}`
          })
        }
        parts.push({
          type: 'inline',
          content: inlineMatch[1],
          key: `inline-${key++}`
        })
        lastInlineIndex = inlineMatch.index + inlineMatch[0].length
      }
      if (lastInlineIndex < afterText.length) {
        parts.push({
          type: 'text',
          content: afterText.slice(lastInlineIndex),
          key: `text-${key++}`
        })
      }
    }

    // 如果没有匹配到任何公式，整个作为文本
    if (parts.length === 0 && content) {
      parts.push({
        type: 'text',
        content: content,
        key: 'text-0'
      })
    }

    return parts
  }, [content])

  return (
    <div className={className}>
      {renderedContent.map((part) => {
        if (part.type === 'text') {
          return <span key={part.key}>{part.content}</span>
        }

        if (part.type === 'inline') {
          try {
            const html = katex.renderToString(part.content, {
              throwOnError: false,
              displayMode: false,
            })
            return (
              <span
                key={part.key}
                dangerouslySetInnerHTML={{ __html: html }}
                className="katex-inline"
              />
            )
          } catch {
            return <span key={part.key} className="text-red-500">${part.content}$</span>
          }
        }

        if (part.type === 'block') {
          try {
            const html = katex.renderToString(part.content, {
              throwOnError: false,
              displayMode: true,
            })
            return (
              <div
                key={part.key}
                dangerouslySetInnerHTML={{ __html: html }}
                className="katex-block my-4 text-center"
              />
            )
          } catch {
            return (
              <div key={part.key} className="text-red-500 my-4">
                $${part.content}$
              </div>
            )
          }
        }

        return null
      })}
    </div>
  )
}
