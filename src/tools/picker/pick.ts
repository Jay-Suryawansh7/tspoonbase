export function excerpt(text: string, length = 150, suffix = '...'): string {
  if (!text || text.length <= length) return text
  return text.slice(0, length).trimEnd() + suffix
}

export function pick(obj: Record<string, any>, keys: string[]): Record<string, any> {
  const result: Record<string, any> = {}
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

export function omit(obj: Record<string, any>, keys: string[]): Record<string, any> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}
