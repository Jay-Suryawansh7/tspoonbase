export interface WorkflowNode {
  id: string
  type: string
  label?: string
  config: Record<string, any>
  position?: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  from: string
  to: string
  label?: string
  condition?: string
}

export interface WorkflowDefinition {
  workflowId: string
  name: string
  description?: string
  version?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  config?: {
    maxRetries?: number
    timeout?: number
    enableLogging?: boolean
    tags?: string[]
  }
}

export interface NodeDefinition {
  type: string
  label: string
  description: string
  category: 'trigger' | 'ai' | 'data' | 'action' | 'logic' | 'output'
  configSchema?: Record<string, any>
  inputs?: number
  outputs?: number
}
