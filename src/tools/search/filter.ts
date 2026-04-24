export interface FilterExpression {
  field: string
  operator: string
  value: any
}

export interface FilterAST {
  type: 'group' | 'expression'
  op?: 'AND' | 'OR'
  expressions?: FilterAST[]
  field?: string
  operator?: string
  value?: any
}

export function parseFilter(filter: string): FilterAST {
  if (!filter || !filter.trim()) {
    return { type: 'group', op: 'AND', expressions: [] }
  }
  const tokens = tokenize(filter)
  const { ast } = parseExpression(tokens, 0)
  return ast
}

function tokenize(filter: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < filter.length; i++) {
    const char = filter[i]

    if (inQuotes) {
      current += char
      if (char === quoteChar) {
        inQuotes = false
        tokens.push(current)
        current = ''
      }
      continue
    }

    if (char === '"' || char === "'") {
      if (current) {
        tokens.push(current)
        current = ''
      }
      inQuotes = true
      quoteChar = char
      current = char
      continue
    }

    if (char === '(' || char === ')') {
      if (current) {
        tokens.push(current)
        current = ''
      }
      tokens.push(char)
      continue
    }

    if (char === ' ' || char === '\t') {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

function parseExpression(tokens: string[], pos: number): { ast: FilterAST; nextPos: number } {
  const expressions: FilterAST[] = []
  let currentPos = pos

  while (currentPos < tokens.length) {
    const token = tokens[currentPos]

    if (token === ')') {
      currentPos++
      break
    }

    if (token === '(') {
      const { ast: groupAst, nextPos } = parseExpression(tokens, currentPos + 1)
      expressions.push(groupAst)
      currentPos = nextPos
      continue
    }

    if (token.toUpperCase() === '&&' || token.toUpperCase() === 'AND') {
      currentPos++
      continue
    }

    if (token.toUpperCase() === '||' || token.toUpperCase() === 'OR') {
      currentPos++
      continue
    }

    // Parse a single expression: field operator value
    if (currentPos + 2 < tokens.length) {
      const field = token
      const op = tokens[currentPos + 1]
      const value = tokens[currentPos + 2]

      const operator = normalizeOperator(op)
      if (operator) {
        expressions.push({
          type: 'expression',
          field,
          operator,
          value: parseValue(value),
        })
        currentPos += 3
        continue
      }
    }

    // Handle multi-word operators like !=, >=, <=, !~, etc.
    if (currentPos + 1 < tokens.length) {
      const field = token
      const combined = tokens[currentPos + 1]
      const operator = normalizeOperator(combined)
      if (operator && currentPos + 2 < tokens.length) {
        expressions.push({
          type: 'expression',
          field,
          operator,
          value: parseValue(tokens[currentPos + 2]),
        })
        currentPos += 3
        continue
      }
    }

    currentPos++
  }

  if (expressions.length === 1) {
    return { ast: expressions[0], nextPos: currentPos }
  }

  return {
    ast: { type: 'group', op: 'AND', expressions },
    nextPos: currentPos,
  }
}

function normalizeOperator(op: string): string | null {
  const map: Record<string, string> = {
    '=': '=',
    '==': '=',
    '!=': '!=',
    '<>': '!=',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    '~': '~',
    '!~': '!~',
    '%': '%',
    '!%': '!%',
    '@': '@',
    '!@': '!@',
    '?=': '?=',
    '?:': '?:',
    'IN': 'in',
    'in': 'in',
    'NOT': 'not',
    'not': 'not',
  }
  return map[op] || null
}

function parseValue(value: string): any {
  if (!value) return ''
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (/^-?\d+$/.test(value)) return parseInt(value, 10)
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value)
  return value
}

export function buildSQL(ast: FilterAST, paramOffset = 0): { where: string; params: any[] } {
  const params: any[] = []

  function walk(node: FilterAST): string {
    if (node.type === 'group') {
      if (!node.expressions || node.expressions.length === 0) return '1=1'
      const parts = node.expressions.map(walk)
      return `(${parts.join(` ${node.op || 'AND'} `)})`
    }

    if (node.type === 'expression') {
      const field = escapeField(node.field!)
      const operator = node.operator!
      const value = node.value

      switch (operator) {
        case '=':
          params.push(value)
          return `${field} = ?`
        case '!=':
          params.push(value)
          return `${field} != ?`
        case '>':
          params.push(value)
          return `${field} > ?`
        case '>=':
          params.push(value)
          return `${field} >= ?`
        case '<':
          params.push(value)
          return `${field} < ?`
        case '<=':
          params.push(value)
          return `${field} <= ?`
        case '~':
          params.push(`%${value}%`)
          return `${field} LIKE ?`
        case '!~':
          params.push(`%${value}%`)
          return `${field} NOT LIKE ?`
        case '%':
          params.push(`${value}%`)
          return `${field} LIKE ?`
        case '!%':
          params.push(`${value}%`)
          return `${field} NOT LIKE ?`
        case '@':
          params.push(`%${value}`)
          return `${field} LIKE ?`
        case '!@':
          params.push(`%${value}`)
          return `${field} NOT LIKE ?`
        case 'in':
          if (Array.isArray(value)) {
            const placeholders = value.map(() => '?').join(', ')
            params.push(...value)
            return `${field} IN (${placeholders})`
          }
          params.push(value)
          return `${field} IN (?)`
        case '?=':
          params.push(value)
          return `EXISTS (SELECT 1 FROM json_each(${field}) WHERE json_each.value = ?)`
        case '?:':
          params.push(`%${value}%`)
          return `EXISTS (SELECT 1 FROM json_each(${field}) WHERE CAST(json_each.value AS TEXT) LIKE ?)`
        case 'not':
          // Unary NOT - wrap the next expression in a NOT
          // This requires the parser to support unary operators properly
          // For now, treat as unsupported in SQL builder
          params.push(value)
          return `NOT (${field} = ?)`
        default:
          params.push(value)
          return `${field} = ?`
      }
    }

    return '1=1'
  }

  const where = walk(ast)
  return { where, params }
}

function escapeField(field: string): string {
  // Prevent SQL injection by only allowing valid field characters
  if (!/^[a-zA-Z0-9_\.\@\:\*]+$/.test(field)) {
    return '"invalid"'
  }
  return field
}

export function buildSortSQL(sort: string): string {
  if (!sort) return 'created DESC'
  
  const parts = sort.split(',').map(s => {
    const trimmed = s.trim()
    if (trimmed.startsWith('-')) {
      return `${escapeField(trimmed.slice(1))} DESC`
    }
    if (trimmed.startsWith('+')) {
      return `${escapeField(trimmed.slice(1))} ASC`
    }
    return `${escapeField(trimmed)} ASC`
  })

  return parts.join(', ')
}

export function evaluateFilterAST(ast: FilterAST, getValue: (field: string) => any): boolean {
  if (ast.type === 'group') {
    if (!ast.expressions || ast.expressions.length === 0) return true
    const results = ast.expressions.map(e => evaluateFilterAST(e, getValue))
    if (ast.op === 'OR') {
      return results.some(r => r)
    }
    return results.every(r => r)
  }

  if (ast.type === 'expression') {
    const fieldValue = getValue(ast.field!)
    const compareValue = ast.value

    switch (ast.operator) {
      case '=':
        return fieldValue == compareValue
      case '!=':
        return fieldValue != compareValue
      case '>':
        return Number(fieldValue) > Number(compareValue)
      case '>=':
        return Number(fieldValue) >= Number(compareValue)
      case '<':
        return Number(fieldValue) < Number(compareValue)
      case '<=':
        return Number(fieldValue) <= Number(compareValue)
      case '~':
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      case '!~':
        return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      case '%':
        return String(fieldValue).startsWith(String(compareValue))
      case '!%':
        return !String(fieldValue).startsWith(String(compareValue))
      case '@':
        return String(fieldValue).endsWith(String(compareValue))
      case '!@':
        return !String(fieldValue).endsWith(String(compareValue))
      case 'in':
        if (Array.isArray(compareValue)) {
          return compareValue.includes(fieldValue)
        }
        return fieldValue == compareValue
      case '?=':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(compareValue)
        }
        if (typeof fieldValue === 'string') {
          try {
            const parsed = JSON.parse(fieldValue)
            if (Array.isArray(parsed)) {
              return parsed.includes(compareValue)
            }
          } catch {
            // ignore
          }
        }
        return fieldValue == compareValue
      case '?:':
        if (Array.isArray(fieldValue)) {
          return fieldValue.some(v => String(v).toLowerCase().includes(String(compareValue).toLowerCase()))
        }
        if (typeof fieldValue === 'string') {
          try {
            const parsed = JSON.parse(fieldValue)
            if (Array.isArray(parsed)) {
              return parsed.some((v: any) => String(v).toLowerCase().includes(String(compareValue).toLowerCase()))
            }
          } catch {
            // ignore
          }
        }
        return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
      default:
        return false
    }
  }

  return true
}
