'use client'

import { create } from 'zustand'
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow'
import { WorkflowNode as TorqueNode, WorkflowEdge as TorqueEdge, NodeDefinition } from '@/types/workflow'

export interface WorkflowMeta {
  name: string
  description: string
  workflowId: string
}

interface WorkflowStore {
  // Canvas state
  nodes: Node[]
  edges: Edge[]
  meta: WorkflowMeta
  nodeTypes: NodeDefinition[]
  selectedNode: string | null
  isRunning: boolean
  executionLog: string[]
  toast: { message: string; type: 'success' | 'error' | 'info' } | null

  // Actions
  setNodeTypes: (types: NodeDefinition[]) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeDefinition, position: { x: number; y: number }) => void
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void
  removeSelected: () => void
  selectNode: (id: string | null) => void
  setMeta: (meta: Partial<WorkflowMeta>) => void
  clearCanvas: () => void

  // Execution
  setRunning: (running: boolean) => void
  addLog: (msg: string) => void
  clearLogs: () => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  dismissToast: () => void
}

let idCounter = 0
function generateId() {
  idCounter++
  return `n_${Date.now().toString(36)}_${idCounter}`
}

const categoryColors: Record<string, string> = {
  trigger: '#f59f00',
  ai: '#6c5ce7',
  data: '#339af0',
  action: '#40c057',
  logic: '#e03131',
  output: '#9898b0',
}

export function getCategoryColor(category: string): string {
  return categoryColors[category] || '#9898b0'
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  meta: { name: 'Untitled Workflow', description: '', workflowId: `wf_${Date.now().toString(36)}` },
  nodeTypes: [],
  selectedNode: null,
  isRunning: false,
  executionLog: [],
  toast: null,

  setNodeTypes: (types) => set({ nodeTypes: types }),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) => set({ edges: addEdge({ ...connection, id: `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}` }, get().edges) }),

  addNode: (type, position) => {
    const id = generateId()
    const newNode: Node = {
      id,
      type: 'workflow',
      position,
      data: { nodeType: type.type, label: type.label, config: {}, category: type.category, configSchema: type.configSchema, inputs: type.inputs ?? 1, outputs: type.outputs ?? 1 },
    }
    set({ nodes: [...get().nodes, newNode] })
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, config } } : n),
    })
  },

  removeSelected: () => {
    const state = get()
    set({
      nodes: state.nodes.filter(n => !n.selected),
      edges: state.edges.filter(e => !e.selected),
      selectedNode: null,
    })
  },

  selectNode: (id) => set({ selectedNode: id }),

  setMeta: (meta) => set({ meta: { ...get().meta, ...meta } }),

  clearCanvas: () => set({ nodes: [], edges: [], selectedNode: null, executionLog: [] }),

  setRunning: (running) => set({ isRunning: running }),
  addLog: (msg) => set({ executionLog: [...get().executionLog, msg] }),
  clearLogs: () => set({ executionLog: [] }),

  showToast: (message, type) => set({ toast: { message, type } }),
  dismissToast: () => set({ toast: null }),
}))
