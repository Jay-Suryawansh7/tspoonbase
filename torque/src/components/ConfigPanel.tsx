'use client'

import { useWorkflowStore } from '@/lib/store'

export default function ConfigPanel() {
  const nodes = useWorkflowStore(s => s.nodes)
  const selectedNode = useWorkflowStore(s => s.selectedNode)
  const updateNodeConfig = useWorkflowStore(s => s.updateNodeConfig)

  const node = nodes.find(n => n.id === selectedNode)
  if (!node) {
    return (
      <div className="w-72 shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
        <p className="text-xs text-[var(--text-muted)]">Select a node to configure</p>
      </div>
    )
  }

  const config = node.data.config || {}
  const schema = node.data.configSchema || {}

  const set = (key: string, value: any) => {
    updateNodeConfig(node.id, { ...config, [key]: value })
  }

  return (
    <div className="w-72 shrink-0 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--border-color)]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{node.data.label}</h2>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{node.data.nodeType}</p>
      </div>
      <div className="p-4 space-y-3">
        {Object.keys(schema).length === 0 && (
          <p className="text-xs text-[var(--text-muted)] italic">No configuration needed</p>
        )}
        {Object.entries(schema).map(([key, val]: [string, any]) => (
          <div key={key}>
            <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
            {val.type === 'string' && (
              <input
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                value={config[key] ?? val.default ?? ''}
                onChange={e => set(key, e.target.value)}
              />
            )}
            {val.type === 'text' && (
              <textarea
                rows={3}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none font-mono"
                value={config[key] ?? val.default ?? ''}
                onChange={e => set(key, e.target.value)}
              />
            )}
            {val.type === 'number' && (
              <input
                type="number"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                value={config[key] ?? val.default ?? ''}
                onChange={e => set(key, parseFloat(e.target.value) || 0)}
              />
            )}
            {val.type === 'select' && (
              <select
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                value={config[key] ?? val.default ?? (val.options?.[0] || '')}
                onChange={e => set(key, e.target.value)}
              >
                {(val.options || []).map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {val.type === 'code' && (
              <textarea
                rows={5}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] resize-none font-mono"
                value={config[key] ?? val.default ?? ''}
                onChange={e => set(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
