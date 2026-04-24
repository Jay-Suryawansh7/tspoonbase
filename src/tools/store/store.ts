export class Store<K = string, V = any> {
  private data: Map<K, V> = new Map()

  set(key: K, value: V): void {
    this.data.set(key, value)
  }

  get(key: K): V | undefined {
    return this.data.get(key)
  }

  has(key: K): boolean {
    return this.data.has(key)
  }

  delete(key: K): boolean {
    return this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  keys(): K[] {
    return Array.from(this.data.keys())
  }

  values(): V[] {
    return Array.from(this.data.values())
  }

  entries(): [K, V][] {
    return Array.from(this.data.entries())
  }

  get size(): number {
    return this.data.size
  }
}
