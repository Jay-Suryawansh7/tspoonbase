import { useEffect, useRef, useState, useId, useCallback } from 'react'
import mermaid from 'mermaid'

function getIsLight() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('light')
}

function getThemeVariables() {
  const isLight = getIsLight()
  return {
    primaryColor: '#0F9B76',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#0d8a6a',
    secondaryColor: isLight ? '#e8e8e8' : '#2a2a2a',
    secondaryTextColor: isLight ? '#1a1a1a' : '#e5e5e5',
    secondaryBorderColor: isLight ? '#d4d4d4' : '#3a3a3a',
    tertiaryColor: isLight ? '#ffffff' : '#1a1a1a',
    tertiaryTextColor: isLight ? '#1a1a1a' : '#e5e5e5',
    tertiaryBorderColor: isLight ? '#d4d4d4' : '#3a3a3a',
    lineColor: isLight ? '#0a7a5c' : '#0F9B76',
    textColor: isLight ? '#1a1a1a' : '#e5e5e5',
    nodeBorder: isLight ? '#d4d4d4' : '#3a3a3a',
    clusterBkg: isLight ? '#f5f5f5' : '#141414',
    clusterBorder: isLight ? '#d4d4d4' : '#2a2a2a',
    titleColor: isLight ? '#1a1a1a' : '#e5e5e5',
    edgeLabelBackground: isLight ? '#ffffff' : '#1a1a1a',
    nodeTextColor: isLight ? '#1a1a1a' : '#e5e5e5',
    fontFamily: 'Space Grotesk, system-ui, sans-serif',
    fontSize: '14px',
  }
}

let mermaidInitialized = false

function initMermaid() {
  if (mermaidInitialized) return
  mermaidInitialized = true
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: getThemeVariables(),
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
    },
    gantt: {
      useMaxWidth: true,
    },
  })
}

function reinitMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: getThemeVariables(),
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
    },
    gantt: {
      useMaxWidth: true,
    },
  })
}

interface MermaidDiagramProps {
  children: string
  caption?: string
  className?: string
}

export default function MermaidDiagram({
  children,
  caption,
  className = '',
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const [themeKey, setThemeKey] = useState(0)
  const uniqueId = useId().replace(/:/g, '-')

  const renderDiagram = useCallback(async () => {
    try {
      const { svg: renderedSvg } = await mermaid.render(
        `mermaid-${uniqueId}-${themeKey}`,
        children.trim()
      )
      setSvg(renderedSvg)
      setError('')
    } catch (err) {
      setError(String(err))
      setSvg('')
    }
  }, [children, uniqueId, themeKey])

  useEffect(() => {
    initMermaid()
    renderDiagram()
  }, [renderDiagram])

  // Re-render when theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          reinitMermaid()
          setThemeKey((k) => k + 1)
        }
      }
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  return (
    <figure className={`my-8 ${className}`}>
      <div
        ref={containerRef}
        className="overflow-x-auto rounded-xl border border-theme bg-theme-surface p-6"
      >
        {svg ? (
          <div
            className="mermaid-diagram flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Failed to render diagram: {error}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-theme-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
