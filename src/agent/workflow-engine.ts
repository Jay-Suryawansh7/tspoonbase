import { WorkflowDefinition, NodeExecutionResult, WorkflowExecutionResult, ExecutionContext } from './types'
import { getNode } from './node-registry'

export interface WorkflowEngineOptions {
  workflow: WorkflowDefinition
  trigger: string
  input?: any
  timeout?: number
  signal?: AbortSignal
  logger?: (msg: string, data?: any) => void
  getVariable?: (key: string) => any
  setVariable?: (key: string, value: any) => void
  app?: any
}

function defaultLogger(msg: string, data?: any) {
  console.log(`[Workflow] ${msg}`, data ?? '')
}

export class WorkflowEngine {
  private workflow: WorkflowDefinition
  private variables: Map<string, any> = new Map()
  private abortSignal?: AbortSignal
  private workflowTimeout?: number
  private app?: any

  constructor(options: WorkflowEngineOptions) {
    this.workflow = options.workflow
    this.abortSignal = options.signal
    this.workflowTimeout = options.timeout || options.workflow.config?.timeout || 120000
    this.app = options.app
    if (options.getVariable) this.variables.set('_get', options.getVariable)
    if (options.setVariable) this.variables.set('_set', options.setVariable)
  }

  private logger = defaultLogger

  async execute(input?: any): Promise<WorkflowExecutionResult> {
    const startTime = new Date()
    // FIXED[H-5]: Use crypto.randomBytes instead of Math.random()
    const crypto = require('crypto')
    const executionId = `exec_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`
    const results: NodeExecutionResult[] = []

    this.logger(`Starting workflow "${this.workflow.name}" (${executionId})`)

    const controller = new AbortController()
    const engineAbort = this.abortSignal
    const timeoutTimer = setTimeout(() => {
      this.logger(`Workflow timed out after ${this.workflowTimeout}ms`)
      controller.abort()
    }, this.workflowTimeout)

    if (engineAbort) {
      engineAbort.addEventListener('abort', () => controller.abort(), { once: true })
    }

    try {
      const order = this.resolveExecutionOrder()

      let currentInput = input
      for (const nodeId of order) {
        if (controller.signal.aborted) throw new Error('Execution timed out')

        const node = this.workflow.nodes.find(n => n.id === nodeId)
        if (!node) {
          results.push({
            nodeId, nodeType: 'unknown', status: 'error', output: null,
            error: `Node ${nodeId} not found in workflow definition`,
            startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 0,
          })
          continue
        }

        const result = await this.executeNode(node, currentInput, executionId, controller.signal)
        results.push(result)

        if (node.type === 'condition') {
          const passed = result.output?.passed
          const nextEdge = this.workflow.edges.find(e => e.from === nodeId && (!e.condition || e.condition === 'true') === !!passed)
          currentInput = result.output?.input ?? currentInput
        } else {
          currentInput = result.output
        }

        if (result.status === 'error') break
      }

      const endTime = new Date()
      return {
        workflowId: this.workflow.workflowId,
        executionId,
        status: controller.signal.aborted ? 'timeout' : results.some(r => r.status === 'error') ? 'failed' : 'completed',
        trigger: 'manual',
        results,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: endTime.getTime() - startTime.getTime(),
      }
    } catch (err: any) {
      const endTime = new Date()
      return {
        workflowId: this.workflow.workflowId,
        executionId,
        status: err.message === 'Execution timed out' ? 'timeout' : 'failed',
        trigger: 'manual',
        results,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: endTime.getTime() - startTime.getTime(),
        error: err.message,
      }
    } finally {
      clearTimeout(timeoutTimer)
    }
  }

  private resolveExecutionOrder(): string[] {
    const { nodes, edges } = this.workflow
    if (!nodes || nodes.length === 0) return []
    if (!edges || edges.length === 0) return nodes.map(n => n.id)

    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    for (const node of nodes) {
      inDegree.set(node.id, 0)
      adjacency.set(node.id, [])
    }

    for (const edge of edges) {
      adjacency.get(edge.from)?.push(edge.to)
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1)
    }

    const queue: string[] = []
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) queue.push(nodeId)
    }

    const order: string[] = []
    const visited = new Set<string>()
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      order.push(nodeId)
      for (const neighbor of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)
        if (newDegree === 0) queue.push(neighbor)
      }
    }

    return order
  }

  private async executeNode(node: any, input: any, executionId: string, signal?: AbortSignal): Promise<NodeExecutionResult> {
    const nodeDef = getNode(node.type)
    if (!nodeDef) {
      return {
        nodeId: node.id, nodeType: node.type, status: 'error', output: null,
        error: `Unknown node type: "${node.type}"`,
        startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 0,
      }
    }

    const ctx: ExecutionContext = {
      workflowId: this.workflow.workflowId,
      executionId,
      logger: this.logger,
      getVariable: (key) => this.variables.get(key) ?? this.variables.get(`_get`)?.(key),
      setVariable: (key, value) => { this.variables.set(key, value); this.variables.get(`_set`)?.(key, value) },
      abortSignal: signal,
      app: this.app,
    }

    try {
      this.logger(`Executing node "${node.id}" (${node.type})`)
      return await nodeDef.execute(node.config || {}, input, ctx)
    } catch (err: any) {
      return {
        nodeId: node.id, nodeType: node.type, status: 'error', output: null,
        error: err.message,
        startTime: new Date().toISOString(), endTime: new Date().toISOString(), duration: 0,
      }
    }
  }
}
