'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, useReactFlow, SelectionMode, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'

import WorkflowNodeComponent from '@/components/WorkflowNode'
import NodePalette from '@/components/NodePalette'
import ConfigPanel from '@/components/ConfigPanel'
import { useWorkflowStore } from '@/lib/store'
import { fetchNodeTypes, exportWorkflow, getExportJson } from '@/lib/api'

const nodeTypes = { workflow: WorkflowNodeComponent }

function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const nodes = useWorkflowStore(s => s.nodes)
  const edges = useWorkflowStore(s => s.edges)
  const meta = useWorkflowStore(s => s.meta)
  const nodeTypesList = useWorkflowStore(s => s.nodeTypes)
  const isRunning = useWorkflowStore(s => s.isRunning)
  const executionLog = useWorkflowStore(s => s.executionLog)
  const toast = useWorkflowStore(s => s.toast)

  const onNodesChange = useWorkflowStore(s => s.onNodesChange)
  const onEdgesChange = useWorkflowStore(s => s.onEdgesChange)
  const onConnect = useWorkflowStore(s => s.onConnect)
  const addNode = useWorkflowStore(s => s.addNode)
  const removeSelected = useWorkflowStore(s => s.removeSelected)
  const selectNode = useWorkflowStore(s => s.selectNode)
  const setNodeTypes = useWorkflowStore(s => s.setNodeTypes)
  const setMeta = useWorkflowStore(s => s.setMeta)
  const clearCanvas = useWorkflowStore(s => s.clearCanvas)
  const setRunning = useWorkflowStore(s => s.setRunning)
  const addLog = useWorkflowStore(s => s.addLog)
  const clearLogs = useWorkflowStore(s => s.clearLogs)
  const dismissToast = useWorkflowStore(s => s.dismissToast)
  const showToast = useWorkflowStore(s => s.showToast)

  const [showExport, setShowExport] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    fetchNodeTypes().then(setNodeTypes).catch(() => {})
  }, [setNodeTypes])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const data = event.dataTransfer.getData('application/reactflow')
    if (!data) return
    const nodeType = JSON.parse(data)
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    addNode(nodeType, position)
  }, [screenToFlowPosition, addNode])

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Backspace' || event.key === 'Delete') { removeSelected() }
  }, [removeSelected])

  const handleExport = async () => {
    const definition = {
      workflowId: meta.workflowId,
      name: meta.name,
      description: meta.description,
      version: '1',
      config: {},
      nodes: nodes.map(n => ({ id: n.id, type: n.data.nodeType, label: n.data.label, config: n.data.config, position: n.position })),
      edges: edges.map(e => ({ id: e.id, from: e.source, to: e.target })),
    }
    try {
      await exportWorkflow(definition)
      showToast('Workflow exported to TspoonBase', 'success')
    } catch {
      // Show as JSON download fallback
      const blob = new Blob([getExportJson(definition)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${meta.workflowId}.json`; a.click()
      URL.revokeObjectURL(url)
      showToast('Exported as JSON file', 'info')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col" onKeyDown={onKeyDown} tabIndex={0}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[var(--accent)]">Torque</span>
          <input
            className="bg-transparent text-sm text-[var(--text-primary)] outline-none border-b border-transparent hover:border-[var(--border-color)] focus:border-[var(--accent)] px-1 py-0.5"
            value={meta.name}
            onChange={e => setMeta({ name: e.target.value })}
          />
          <span className="text-[10px] text-[var(--text-muted)]">{nodes.length} nodes, {edges.length} connections</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            onClick={() => clearCanvas()}
          >
            New
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            onClick={handleExport}
          >
            Export
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div ref={reactFlowWrapper} className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            nodeTypes={nodeTypes}
            selectionMode={SelectionMode.Partial}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color="#1e1e2e" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeColor="#6c5ce7"
              nodeColor="#1a1a26"
              nodeBorderRadius={4}
              maskColor="rgba(10,10,15,0.7)"
            />
          </ReactFlow>
        </div>
        <ConfigPanel />
      </div>

      {/* Bottom bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0 text-[10px] text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          <button className="hover:text-[var(--text-primary)] transition-colors" onClick={() => setShowLogs(!showLogs)}>
            {showLogs ? 'Hide' : 'Show'} Logs
          </button>
          {isRunning && <span className="text-[var(--amber)] animate-pulse">Running...</span>}
        </div>
        <span>TspoonBase Agent Engine v0.9.0</span>
      </footer>

      {/* Log panel */}
      {showLogs && (
        <div className="h-40 border-t border-[var(--border-color)] bg-[var(--bg-primary)] overflow-y-auto p-3 font-mono text-[11px]">
          {executionLog.length === 0 && <span className="text-[var(--text-muted)]">No logs yet. Run a workflow to see output.</span>}
          {executionLog.map((log, i) => (
            <div key={i} className="text-[var(--text-secondary)] leading-relaxed">{log}</div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50 transition-all ${
          toast.type === 'success' ? 'bg-[var(--green)] text-white' :
          toast.type === 'error' ? 'bg-[var(--red)] text-white' :
          'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)]'
        }`}>
          {toast.message}
          <button className="ml-3 opacity-70 hover:opacity-100" onClick={dismissToast}>✕</button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
