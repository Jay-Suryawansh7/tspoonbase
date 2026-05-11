import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { getCategoryColor } from '@/lib/store'

function WorkflowNode({ data, selected }: NodeProps) {
  const color = getCategoryColor(data.category)

  return (
    <div className={`torque-node rounded-xl border bg-[var(--bg-surface)] px-4 py-3 min-w-[180px] transition-all ${selected ? 'ring-2 ring-[var(--accent)]' : 'border-[var(--border-color)]'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{data.category}</span>
      </div>
      <div className="text-sm font-medium text-[var(--text-primary)]">{data.label}</div>
      {data.nodeType === 'llm' && data.config?.model && (
        <div className="text-[10px] text-[var(--text-muted)] mt-1">{data.config.model}</div>
      )}
      {data.nodeType === 'http_request' && data.config?.url && (
        <div className="text-[10px] text-[var(--text-muted)] mt-1 truncate">{data.config.method || 'GET'} {data.config.url}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(WorkflowNode)
