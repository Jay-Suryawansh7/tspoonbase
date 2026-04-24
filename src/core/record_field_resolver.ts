import { RecordModel as PBRecord } from '../core/record'
import { Collection } from '../core/collection'
import { BaseApp } from '../core/base'

export interface RequestInfo {
  auth: PBRecord | null
  isAdmin: boolean
  method: string
  headers: Record<string, string>
  query: Record<string, string>
  body: any
  data: any
  context: string
}

export interface RecordFieldResolverOptions {
  app?: BaseApp
  record?: PBRecord
  collection?: Collection
  requestInfo?: RequestInfo
  hiddenFields?: Set<string>
}

export class RecordFieldResolver {
  private app: BaseApp | null
  private record: PBRecord | null
  private collection: Collection | null
  private requestInfo: RequestInfo | null
  private hiddenFields: Set<string>

  constructor(options: RecordFieldResolverOptions = {}) {
    this.app = options.app ?? null
    this.record = options.record ?? null
    this.collection = options.collection ?? null
    this.requestInfo = options.requestInfo ?? null
    this.hiddenFields = options.hiddenFields ?? new Set()
  }

  resolve(path: string): any {
    const parts = path.split('.')

    if (parts[0] === '@request') {
      return this.resolveRequest(parts.slice(1))
    }

    if (parts[0] === '@collection') {
      return this.resolveCollection(parts.slice(1))
    }

    if (this.record) {
      return this.resolveRecordField(parts)
    }

    return undefined
  }

  private resolveRequest(parts: string[]): any {
    if (!this.requestInfo) return undefined

    if (parts[0] === 'context') return this.requestInfo.context
    if (parts[0] === 'method') return this.requestInfo.method
    if (parts[0] === 'isAdmin') return this.requestInfo.isAdmin

    if (parts[0] === 'auth') {
      if (!this.requestInfo.auth) return undefined
      if (parts.length === 1) return this.requestInfo.auth
      return this.requestInfo.auth.get(parts.slice(1).join('.'))
    }

    if (parts[0] === 'headers') {
      if (parts.length === 1) return this.requestInfo.headers
      const headerKey = parts.slice(1).join('.').toLowerCase()
      return this.requestInfo.headers[headerKey] ?? this.requestInfo.headers[parts.slice(1).join('.')]
    }

    if (parts[0] === 'query') {
      if (parts.length === 1) return this.requestInfo.query
      return this.requestInfo.query[parts.slice(1).join('.')]
    }

    if (parts[0] === 'data') {
      if (parts.length === 1) return this.requestInfo.data
      return this.resolvePath(this.requestInfo.data, parts.slice(1))
    }

    if (parts[0] === 'body') {
      if (parts.length === 1) return this.requestInfo.body
      return this.resolvePath(this.requestInfo.body, parts.slice(1))
    }

    return undefined
  }

  private resolveCollection(parts: string[]): any {
    if (!this.collection) return undefined
    if (parts[0] === 'id') return this.collection.id
    if (parts[0] === 'name') return this.collection.name
    if (parts[0] === 'type') return this.collection.type
    return undefined
  }

  private resolveRecordField(parts: string[]): any {
    if (!this.record) return undefined

    const fieldName = parts[0]
    if (this.hiddenFields.has(fieldName)) return undefined

    const value = this.record.get(fieldName)
    if (parts.length === 1) return value

    if (typeof value === 'object' && value !== null) {
      return this.resolvePath(value, parts.slice(1))
    }

    return undefined
  }

  private resolvePath(obj: any, parts: string[]): any {
    let current = obj
    for (const part of parts) {
      if (current === null || current === undefined) return undefined
      current = current[part]
    }
    return current
  }

  resolveWithModifier(path: string): any {
    const modifierMatch = path.match(/^(.+?)(?::([a-zA-Z]+))$/)
    if (modifierMatch) {
      const basePath = modifierMatch[1]
      const modifier = modifierMatch[2]
      const value = this.resolve(basePath)
      return this.applyModifier(value, modifier)
    }
    return this.resolve(path)
  }

  applyModifier(value: any, modifier: string): any {
    switch (modifier) {
      case 'lower':
        return typeof value === 'string' ? value.toLowerCase() : value
      case 'upper':
        return typeof value === 'string' ? value.toUpperCase() : value
      case 'length':
        if (typeof value === 'string') return value.length
        if (Array.isArray(value)) return value.length
        if (typeof value === 'object' && value !== null) return Object.keys(value).length
        return 0
      case 'isset':
        return value !== null && value !== undefined && value !== ''
      case 'each':
        if (Array.isArray(value)) return value
        if (typeof value === 'string') return [value]
        return []
      case 'excerpt':
        if (typeof value === 'string') {
          // Strip HTML and limit to ~200 chars
          return value
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200)
        }
        return value
      case 'trim':
        return typeof value === 'string' ? value.trim() : value
      case 'abs':
        return typeof value === 'number' ? Math.abs(value) : value
      default:
        return value
    }
  }
}

export function evaluateRule(rule: string | null | undefined, resolver: RecordFieldResolver): boolean {
  if (!rule || rule === '') return true
  if (rule === '@request.auth.id != ""' && !resolver.resolve('@request.auth.id')) return false

  try {
    return evaluateExpression(rule, resolver)
  } catch {
    return false
  }
}

function evaluateExpression(expr: string, resolver: RecordFieldResolver): boolean {
  expr = expr.trim()

  if (!expr) return true

  // Handle parentheses groups
  if (expr.startsWith('(') && expr.endsWith(')')) {
    // Find matching parenthesis to handle nested groups
    let depth = 0
    let matchIndex = -1
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') depth++
      if (expr[i] === ')') {
        depth--
        if (depth === 0) {
          matchIndex = i
          break
        }
      }
    }
    if (matchIndex === expr.length - 1) {
      return evaluateExpression(expr.slice(1, -1), resolver)
    }
  }

  // Split by top-level ||
  const orParts = splitByOperator(expr, '||')
  if (orParts.length > 1) {
    return orParts.some(p => evaluateExpression(p.trim(), resolver))
  }

  // Split by top-level &&
  const andParts = splitByOperator(expr, '&&')
  if (andParts.length > 1) {
    return andParts.every(p => evaluateExpression(p.trim(), resolver))
  }

  // Negation
  if (expr.startsWith('!(') && expr.endsWith(')')) {
    return !evaluateExpression(expr.slice(2, -1), resolver)
  }
  if (expr.startsWith('!')) {
    return !evaluateExpression(expr.slice(1), resolver)
  }

  // Comparison operators - check longer ones first
  const operators = ['!=', '==', '>=', '<=', '=', '>', '<', '~', '%', '@']
  for (const op of operators) {
    const parts = splitByOperator(expr, op, true)
    if (parts.length === 2) {
      const leftVal = resolveValue(parts[0].trim(), resolver)
      const rightVal = resolveValue(parts[1].trim(), resolver)
      return compareValues(leftVal, op, rightVal)
    }
  }

  // Ternary
  if (expr.includes('?')) {
    const qIndex = expr.indexOf('?')
    const condition = expr.slice(0, qIndex).trim()
    const rest = expr.slice(qIndex + 1)
    const thenElse = rest.split(':')
    if (evaluateExpression(condition, resolver)) {
      return evaluateExpression(thenElse[0].trim(), resolver)
    }
    return thenElse.length > 1 ? evaluateExpression(thenElse[1].trim(), resolver) : false
  }

  const value = resolveValue(expr, resolver)
  return Boolean(value)
}

function splitByOperator(expr: string, op: string, onlyFirst = false): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i]

    if (inQuotes) {
      current += char
      if (char === quoteChar) inQuotes = false
      continue
    }

    if (char === '"' || char === "'") {
      inQuotes = true
      quoteChar = char
      current += char
      continue
    }

    if (char === '(') {
      depth++
      current += char
      continue
    }
    if (char === ')') {
      depth--
      current += char
      continue
    }

    if (depth === 0) {
      const rest = expr.slice(i)
      if (rest.startsWith(op)) {
        parts.push(current.trim())
        if (onlyFirst) {
          parts.push(rest.slice(op.length).trim())
          return parts
        }
        current = ''
        i += op.length - 1
        continue
      }
    }

    current += char
  }

  if (current) parts.push(current.trim())
  return parts
}

function compareValues(left: any, op: string, right: any): boolean {
  switch (op) {
    case '!=':
      return left != right
    case '==':
    case '=':
      return left == right
    case '>=':
      return Number(left) >= Number(right)
    case '<=':
      return Number(left) <= Number(right)
    case '>':
      return Number(left) > Number(right)
    case '<':
      return Number(left) < Number(right)
    case '~':
      return String(left).toLowerCase().includes(String(right).toLowerCase())
    case '%':
      return String(left).startsWith(String(right))
    case '@':
      return String(left).endsWith(String(right))
    default:
      return false
  }
}

function resolveValue(expr: string, resolver: RecordFieldResolver): any {
  expr = expr.trim()

  if (expr.startsWith('"') && expr.endsWith('"')) {
    return expr.slice(1, -1)
  }

  if (expr.startsWith("'") && expr.endsWith("'")) {
    return expr.slice(1, -1)
  }

  if (expr === 'true') return true
  if (expr === 'false') return false
  if (expr === 'null') return null
  if (expr === 'undefined') return undefined

  if (/^-?\d+$/.test(expr)) return parseInt(expr, 10)
  if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr)

  return resolver.resolveWithModifier(expr)
}
