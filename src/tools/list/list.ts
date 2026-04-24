export function existInSlice<T>(item: T, slice: T[]): boolean {
  return slice.includes(item)
}

export function removeDuplicates<T>(slice: T[]): T[] {
  return Array.from(new Set(slice))
}

export function uniqueBy<T, K>(slice: T[], keyFn: (item: T) => K): T[] {
  const seen = new Map<K, T>()
  for (const item of slice) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.set(key, item)
    }
  }
  return Array.from(seen.values())
}

export function chunk<T>(slice: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < slice.length; i += size) {
    chunks.push(slice.slice(i, i + size))
  }
  return chunks
}

export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(item => setB.has(item))
}

export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter(item => !setB.has(item))
}

export function union<T>(a: T[], b: T[]): T[] {
  return Array.from(new Set([...a, ...b]))
}
