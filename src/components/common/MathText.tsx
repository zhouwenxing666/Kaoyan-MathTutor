'use client'
import { useEffect, useRef } from 'react'
import katex from 'katex'

interface MathTextProps {
  content: string
  className?: string
}

function MathText({ content, className = '' }: MathTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const html = content
      .replace(/\\\((.*?)\\\)/g, (_, tex) => {
        try { return katex.renderToString(tex, { throwOnError: false }) } 
        catch { return tex }
      })
      .replace(/\\\[(.*?)\\\]/g, (_, tex) => {
        try { return katex.renderToString(tex, { throwOnError: false, displayMode: true }) } 
        catch { return tex }
      })
    ref.current.innerHTML = html
  }, [content])

  return <span ref={ref} className={className} />
}

export { MathText }
export default MathText
