'use client'

import { useWorkflowStore, getCategoryColor } from '@/lib/store'
import { NodeDefinition } from '@/types/workflow'

const categories: { key: string; label: string }[] = [
  { key: 'trigger', label: 'Triggers' },
  { key: 'ai', label: 'AI' },
  { key: 'data', label: 'Data' },
  { key: 'action', label: 'Actions' },
  { key: 'logic', label: 'Logic' },
  { key: 'output', label: 'Output' },
]

export default function NodePalette() {
  const nodeTypes = useWorkflowStore(s => s.nodeTypes)
  const addNode = useWorkflowStore(s => s.addNode)

  const onDragStart = (event: React.DragEvent, nodeType: NodeDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-60 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--border-color)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Nodes</h2>
      </div>
      {categories.map(cat => {
        const items = nodeTypes.filter(n => n.category === cat.key)
        if (items.length === 0) return null
        return (
          <div key={cat.key} className="px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 px-1">
              {cat.label}
            </div>
            {items.map(node => (
              <div
                key={node.type}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-[var(--bg-elevated)] transition-colors text-sm text-[var(--text-secondary)]"
                draggable
                onDragStart={(e) => onDragStart(e, node)}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColor(node.category) }} />
                <span>{node.label}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
