import { NodeDefinition, NodeExecutionResult, ExecutionContext } from './types'

const registry = new Map<string, NodeDefinition>()

export function registerNode(def: NodeDefinition): void {
  if (registry.has(def.type)) {
    throw new Error(`Node type "${def.type}" is already registered`)
  }
  registry.set(def.type, def)
}

export function getNode(type: string): NodeDefinition | undefined {
  return registry.get(type)
}

export function listNodes(): NodeDefinition[] {
  return Array.from(registry.values())
}

export function listNodesByCategory(category: string): NodeDefinition[] {
  return Array.from(registry.values()).filter(n => n.category === category)
}

function makeResult(nodeId: string, nodeType: string, output: any, status: 'success' | 'error' = 'success', error?: string): NodeExecutionResult {
  const start = new Date()
  const end = new Date()
  return { nodeId, nodeType, status, output, error, startTime: start.toISOString(), endTime: end.toISOString(), duration: end.getTime() - start.getTime() }
}

async function executeSandboxed(code: string, input: any, ctx: ExecutionContext, timeoutMs = 5000): Promise<any> {
  // Strip dangerous statements before execution
  const blocked = ['process', 'require', '__dirname', '__filename', 'global', 'import(', 'eval(', 'constructor']
  const hasBlocked = blocked.some(b => code.includes(b))
  if (hasBlocked) throw new Error('Code contains blocked identifiers: process, require, import, eval, constructor, __dirname, __filename, global')

  const fn = new Function('input', 'ctx', 'console', code)
  const result = await Promise.race([
    fn(input, ctx, ctx.logger ? { log: ctx.logger } : console),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Code execution timed out')), timeoutMs)),
  ])
  return result
}

registerNode({
  type: 'trigger_webhook',
  label: 'Webhook',
  description: 'Start workflow via HTTP webhook',
  category: 'trigger',
  execute: async (config, input, ctx) => {
    return makeResult(ctx.executionId, 'trigger_webhook', input || {})
  },
})

registerNode({
  type: 'trigger_cron',
  label: 'Schedule',
  description: 'Start workflow on a cron schedule',
  category: 'trigger',
  execute: async (config, input, ctx) => {
    return makeResult(ctx.executionId, 'trigger_cron', { triggeredAt: new Date().toISOString(), schedule: config.schedule })
  },
})

registerNode({
  type: 'trigger_event',
  label: 'Event',
  description: 'Start workflow on a TspoonBase event (record create, update, delete)',
  category: 'trigger',
  execute: async (config, input, ctx) => {
    return makeResult(ctx.executionId, 'trigger_event', input || {})
  },
})

registerNode({
  type: 'llm',
  label: 'LLM Call',
  description: 'Call an AI language model (OpenAI, Anthropic, Ollama)',
  category: 'ai',
  execute: async (config, input, ctx) => {
    if (ctx.abortSignal?.aborted) return makeResult(ctx.executionId, 'llm', null, 'error', 'Execution aborted')
    const provider = config.provider || 'openai'
    const model = config.model || 'gpt-4o'
    const systemPrompt = config.systemPrompt || ''
    const userMessage = typeof input === 'string' ? input : JSON.stringify(input)

    ctx.logger(`Calling ${provider} ${model}`)

    const messages: any[] = []
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
    messages.push({ role: 'user', content: userMessage })

    if (provider === 'openai') {
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY
      if (!apiKey) return makeResult(ctx.executionId, 'llm', null, 'error', 'OPENAI_API_KEY not configured')
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 60000)
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: controller.signal,
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages, temperature: config.temperature ?? 0.7, max_tokens: config.maxTokens ?? 2048 }),
        })
        if (!res.ok) return makeResult(ctx.executionId, 'llm', null, 'error', `OpenAI error: ${res.status} ${res.statusText}`)
        const json: any = await res.json()
        const text = json.choices?.[0]?.message?.content || ''
        const usage = json.usage || {}
        return { ...makeResult(ctx.executionId, 'llm', text), tokenUsage: { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0, total: usage.total_tokens || 0 } }
      } finally { clearTimeout(timer) }
    }

    if (provider === 'anthropic') {
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY
      if (!apiKey) return makeResult(ctx.executionId, 'llm', null, 'error', 'ANTHROPIC_API_KEY not configured')
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 60000)
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: controller.signal,
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: model.replace('claude-', '') || 'claude-sonnet-4-20250514', max_tokens: config.maxTokens ?? 2048, system: systemPrompt || undefined, messages: [{ role: 'user', content: userMessage }] }),
        })
        if (!res.ok) return makeResult(ctx.executionId, 'llm', null, 'error', `Anthropic error: ${res.status} ${res.statusText}`)
        const json: any = await res.json()
        return makeResult(ctx.executionId, 'llm', json.content?.[0]?.text || '')
      } finally { clearTimeout(timer) }
    }

    return makeResult(ctx.executionId, 'llm', null, 'error', `Unsupported provider: ${provider}`)
  },
  configSchema: {
    provider: { type: 'select', options: ['openai', 'anthropic'], default: 'openai' },
    model: { type: 'string', default: 'gpt-4o' },
    systemPrompt: { type: 'text', default: '' },
    temperature: { type: 'number', default: 0.7 },
    maxTokens: { type: 'number', default: 2048 },
  },
})

registerNode({
  type: 'http_request',
  label: 'HTTP Request',
  description: 'Make an HTTP request to any URL',
  category: 'action',
  execute: async (config, input, ctx) => {
    if (ctx.abortSignal?.aborted) return makeResult(ctx.executionId, 'http_request', null, 'error', 'Execution aborted')
    const url = config.url
    if (!url) return makeResult(ctx.executionId, 'http_request', null, 'error', 'URL is required')

    const method = config.method || 'GET'
    const headers = config.headers || {}
    const body = config.body || (method !== 'GET' ? JSON.stringify(input) : undefined)

    ctx.logger(`HTTP ${method} ${url}`)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 30000)
    try {
      const res = await fetch(url, { method, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) }, body: body as string | undefined })
      const text = await res.text()
      let data: any = text
      try { data = JSON.parse(text) } catch {}
      return makeResult(ctx.executionId, 'http_request', { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) })
    } finally { clearTimeout(timer) }
  },
  configSchema: {
    url: { type: 'string', required: true },
    method: { type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' },
  },
})

registerNode({
  type: 'code',
  label: 'Execute Code',
  description: 'Run a JavaScript snippet (sandboxed, 5s timeout)',
  category: 'action',
  execute: async (config, input, ctx) => {
    const code = config.code
    if (!code) return makeResult(ctx.executionId, 'code', null, 'error', 'No code provided')
    if (ctx.abortSignal?.aborted) return makeResult(ctx.executionId, 'code', null, 'error', 'Execution aborted')
    try {
      const result = await executeSandboxed(code, input, ctx, 5000)
      return makeResult(ctx.executionId, 'code', result)
    } catch (err: any) {
      return makeResult(ctx.executionId, 'code', null, 'error', err.message)
    }
  },
  configSchema: {
    code: { type: 'code', default: 'return input' },
  },
})

registerNode({
  type: 'condition',
  label: 'Condition',
  description: 'Route execution based on a condition',
  category: 'logic',
  execute: async (config, input, ctx) => {
    const expression = String(config.expression || '')
    if (!expression) return makeResult(ctx.executionId, 'condition', { passed: true })
    const blocked = ['process', 'require', 'import(', 'eval(', 'constructor', 'prototype', '__proto__']
    if (blocked.some(b => expression.includes(b))) {
      return makeResult(ctx.executionId, 'condition', { passed: false, input }, 'error', 'Expression contains blocked keywords')
    }
    try {
      const fn = new Function('input', `return Boolean(${expression})`)
      const passed = fn(input)
      return makeResult(ctx.executionId, 'condition', { passed, input })
    } catch (err: any) {
      return makeResult(ctx.executionId, 'condition', { passed: false, input }, 'error', err.message)
    }
  },
  outputs: 2,
})

registerNode({
  type: 'create_record',
  label: 'Create Record',
  description: 'Create a record in a TspoonBase collection',
  category: 'data',
  execute: async (config, input, ctx) => {
    if (!ctx.app) return makeResult(ctx.executionId, 'create_record', null, 'error', 'App context not available')
    const collection = config.collection
    if (!collection) return makeResult(ctx.executionId, 'create_record', null, 'error', 'Collection name is required')
    try {
      const data = typeof input === 'object' && input !== null ? input : {}
      const record = await ctx.app.collection(collection).create(data)
      return makeResult(ctx.executionId, 'create_record', record)
    } catch (err: any) {
      return makeResult(ctx.executionId, 'create_record', null, 'error', err.message)
    }
  },
})

registerNode({
  type: 'query_records',
  label: 'Query Records',
  description: 'Query records from a TspoonBase collection',
  category: 'data',
  execute: async (config, input, ctx) => {
    if (!ctx.app) return makeResult(ctx.executionId, 'query_records', null, 'error', 'App context not available')
    const collection = config.collection
    if (!collection) return makeResult(ctx.executionId, 'query_records', null, 'error', 'Collection name is required')
    try {
      const filter = config.filter || ''
      const sort = config.sort || '-created'
      const limit = config.limit || 50
      const page = config.page || 1
      const records = await ctx.app.collection(collection).getList(page, limit, { filter, sort })
      return makeResult(ctx.executionId, 'query_records', records)
    } catch (err: any) {
      return makeResult(ctx.executionId, 'query_records', null, 'error', err.message)
    }
  },
})

registerNode({
  type: 'output',
  label: 'Output',
  description: 'Return data as workflow output',
  category: 'output',
  execute: async (config, input, ctx) => {
    return makeResult(ctx.executionId, 'output', input)
  },
})

registerNode({
  type: 'delay',
  label: 'Delay',
  description: 'Wait for a specified duration',
  category: 'action',
  execute: async (config, input, ctx) => {
    const ms = Math.min(parseInt(config.durationMs) || 1000, 300000)
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms)
      if (ctx.abortSignal) {
        ctx.abortSignal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Execution aborted')) }, { once: true })
      }
    })
    return makeResult(ctx.executionId, 'delay', { waited: ms, input })
  },
  configSchema: {
    durationMs: { type: 'number', default: 1000 },
  },
})
