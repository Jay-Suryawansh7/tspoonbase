import { EventEmitter } from 'events'

export class Hook<T = any> {
  private handlers: Array<{ id: string; priority: number; fn: (data: T) => Promise<void> | void }> = []

  bind(handler: { id?: string; priority?: number; func: (data: T) => Promise<void> | void }): void {
    this.handlers.push({
      id: handler.id ?? `handler_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      priority: handler.priority ?? 0,
      fn: handler.func,
    })
    this.handlers.sort((a, b) => b.priority - a.priority)
  }

  bindFunc(fn: (data: T) => Promise<void> | void, id?: string, priority?: number): void {
    this.bind({ id, priority, func: fn })
  }

  async trigger(data: T, fallback?: (data: T) => Promise<void> | void): Promise<void> {
    for (const handler of this.handlers) {
      await handler.fn(data)
    }
    if (fallback) {
      await fallback(data)
    }
  }

  has(id: string): boolean {
    return this.handlers.some(h => h.id === id)
  }

  remove(id: string): void {
    this.handlers = this.handlers.filter(h => h.id !== id)
  }

  clear(): void {
    this.handlers = []
  }
}

export class TaggedHook<T = any> extends Hook<T> {
  private tagHandlers: Map<string, Array<{ id: string; priority: number; fn: (data: T) => Promise<void> | void }>> = new Map()

  bind(handler: { id?: string; priority?: number; tags?: string[]; func: (data: T) => Promise<void> | void }): void {
    super.bind({ id: handler.id, priority: handler.priority, func: handler.func })
    if (handler.tags?.length) {
      for (const tag of handler.tags) {
        if (!this.tagHandlers.has(tag)) {
          this.tagHandlers.set(tag, [])
        }
        this.tagHandlers.get(tag)!.push({
          id: handler.id ?? `tagged_${Date.now()}`,
          priority: handler.priority ?? 0,
          fn: handler.func,
        })
      }
    }
  }

  async triggerForTag(tag: string, data: T, fallback?: (data: T) => Promise<void> | void): Promise<void> {
    const handlers = this.tagHandlers.get(tag) ?? []
    for (const handler of handlers) {
      await handler.fn(data)
    }
    if (fallback) {
      await fallback(data)
    }
  }
}
