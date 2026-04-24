import { describe, it, expect } from 'vitest'
import { parseFilter, buildSQL, buildSortSQL, evaluateFilterAST } from '../src/tools/search/filter'

describe('Filter Parser', () => {
  it('should parse simple equality', () => {
    const ast = parseFilter('name = "test"')
    expect(ast.type).toBe('expression')
    expect((ast as any).field).toBe('name')
    expect((ast as any).operator).toBe('=')
    expect((ast as any).value).toBe('test')
  })

  it('should parse numeric comparison', () => {
    const ast = parseFilter('count > 10')
    expect((ast as any).operator).toBe('>')
    expect((ast as any).value).toBe(10)
  })

  it('should parse contains operator', () => {
    const ast = parseFilter('title ~ "hello"')
    expect((ast as any).operator).toBe('~')
    expect((ast as any).value).toBe('hello')
  })

  it('should parse multiple conditions with AND', () => {
    const ast = parseFilter('a = 1 && b = 2')
    expect(ast.type).toBe('group')
    expect((ast as any).expressions).toHaveLength(2)
  })

  it('should parse negation', () => {
    const ast = parseFilter('!(status = "deleted")')
    expect(ast.type).toBe('expression')
  })

  it('should build SQL from AST', () => {
    const ast = parseFilter('name = "test" && count > 5')
    const { where, params } = buildSQL(ast)
    expect(where).toContain('name = ?')
    expect(where).toContain('count > ?')
    expect(params).toContain('test')
    expect(params).toContain(5)
  })

  it('should build sort SQL', () => {
    expect(buildSortSQL('name')).toBe('name ASC')
    expect(buildSortSQL('-name')).toBe('name DESC')
    expect(buildSortSQL('+name')).toBe('name ASC')
    expect(buildSortSQL('name,-count')).toBe('name ASC, count DESC')
  })

  it('should evaluate filter AST', () => {
    const ast = parseFilter('name = "test"')
    const result = evaluateFilterAST(ast, (field) => {
      if (field === 'name') return 'test'
      return undefined
    })
    expect(result).toBe(true)
  })

  it('should evaluate numeric filter', () => {
    const ast = parseFilter('count > 10')
    const result = evaluateFilterAST(ast, (field) => {
      if (field === 'count') return 15
      return undefined
    })
    expect(result).toBe(true)
  })

  it('should parse ?= (any equal) operator', () => {
    const ast = parseFilter('tags ?= "red"')
    expect((ast as any).operator).toBe('?=')
    expect((ast as any).value).toBe('red')
  })

  it('should evaluate ?= operator on arrays', () => {
    const ast = parseFilter('tags ?= "red"')
    const result = evaluateFilterAST(ast, (field) => {
      if (field === 'tags') return ['red', 'blue']
      return undefined
    })
    expect(result).toBe(true)
  })

  it('should evaluate ?= operator on JSON string arrays', () => {
    const ast = parseFilter('tags ?= "red"')
    const result = evaluateFilterAST(ast, (field) => {
      if (field === 'tags') return '["red","blue"]'
      return undefined
    })
    expect(result).toBe(true)
  })

  it('should evaluate ?: (any contains) operator on arrays', () => {
    const ast = parseFilter('tags ?: "lu"')
    const result = evaluateFilterAST(ast, (field) => {
      if (field === 'tags') return ['blue', 'purple']
      return undefined
    })
    expect(result).toBe(true)
  })

  it('should build SQL for ?= operator', () => {
    const ast = parseFilter('tags ?= "red"')
    const { where, params } = buildSQL(ast)
    expect(where).toContain('json_each')
    expect(where).toContain('tags')
    expect(params).toContain('red')
  })

  it('should build SQL for ?: operator', () => {
    const ast = parseFilter('tags ?: "lu"')
    const { where, params } = buildSQL(ast)
    expect(where).toContain('json_each')
    expect(where).toContain('LIKE')
    expect(params).toContain('%lu%')
  })
})
