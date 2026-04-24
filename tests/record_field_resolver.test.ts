import { describe, it, expect } from 'vitest'
import { RecordFieldResolver, evaluateRule } from '../src/core/record_field_resolver'
import { RecordModel as PBRecord } from '../src/core/record'
import { Collection } from '../src/core/collection'

describe('RecordFieldResolver', () => {
  const collection = new Collection({
    name: 'test',
    type: 'base',
    system: false,
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [],
    indexes: [],
  })

  const record = new PBRecord(collection.id, collection.name, {
    title: 'Hello World',
    count: 42,
    tags: ['a', 'b', 'c'],
  })

  it('should resolve record fields', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    expect(resolver.resolve('title')).toBe('Hello World')
    expect(resolver.resolve('count')).toBe(42)
    expect(resolver.resolve('tags')).toEqual(['a', 'b', 'c'])
  })

  it('should resolve @request fields', () => {
    const requestInfo = {
      auth: null,
      isAdmin: false,
      method: 'GET',
      headers: { 'x-custom': 'value' },
      query: { page: '1' },
      body: { name: 'test' },
      data: { name: 'test' },
      context: 'list',
    }

    const resolver = new RecordFieldResolver({ requestInfo })
    expect(resolver.resolve('@request.method')).toBe('GET')
    expect(resolver.resolve('@request.headers.x-custom')).toBe('value')
    expect(resolver.resolve('@request.query.page')).toBe('1')
    expect(resolver.resolve('@request.body.name')).toBe('test')
  })

  it('should resolve @collection fields', () => {
    const resolver = new RecordFieldResolver({ collection })
    expect(resolver.resolve('@collection.id')).toBe(collection.id)
    expect(resolver.resolve('@collection.name')).toBe('test')
    expect(resolver.resolve('@collection.type')).toBe('base')
  })

  it('should apply lower modifier', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    expect(resolver.resolveWithModifier('title:lower')).toBe('hello world')
  })

  it('should apply upper modifier', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    expect(resolver.resolveWithModifier('title:upper')).toBe('HELLO WORLD')
  })

  it('should apply length modifier', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    expect(resolver.resolveWithModifier('title:length')).toBe(11)
    expect(resolver.resolveWithModifier('tags:length')).toBe(3)
  })

  it('should apply isset modifier', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    expect(resolver.resolveWithModifier('title:isset')).toBe(true)
    expect(resolver.resolveWithModifier('missing:isset')).toBe(false)
  })

  it('should apply each modifier', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    expect(resolver.resolveWithModifier('tags:each')).toEqual(['a', 'b', 'c'])
    expect(resolver.resolveWithModifier('title:each')).toEqual(['Hello World'])
  })

  it('should apply excerpt modifier', () => {
    const resolver = new RecordFieldResolver({ record, collection })
    const htmlRecord = new PBRecord(collection.id, collection.name, {
      content: '<p>Hello <strong>World</strong></p>',
    })
    const htmlResolver = new RecordFieldResolver({ record: htmlRecord, collection })
    expect(htmlResolver.resolveWithModifier('content:excerpt')).toBe('Hello World')
  })
})

describe('evaluateRule', () => {
  it('should return true for empty rule', () => {
    const resolver = new RecordFieldResolver()
    expect(evaluateRule('', resolver)).toBe(true)
    expect(evaluateRule(null, resolver)).toBe(true)
  })

  it('should evaluate simple equality', () => {
    const record = new PBRecord('col1', 'test', { status: 'active' })
    const resolver = new RecordFieldResolver({ record })
    expect(evaluateRule('status = "active"', resolver)).toBe(true)
    expect(evaluateRule('status = "inactive"', resolver)).toBe(false)
  })

  it('should evaluate numeric comparisons', () => {
    const record = new PBRecord('col1', 'test', { count: 42 })
    const resolver = new RecordFieldResolver({ record })
    expect(evaluateRule('count > 10', resolver)).toBe(true)
    expect(evaluateRule('count < 100', resolver)).toBe(true)
    expect(evaluateRule('count >= 42', resolver)).toBe(true)
    expect(evaluateRule('count <= 42', resolver)).toBe(true)
  })

  it('should evaluate contains operator', () => {
    const record = new PBRecord('col1', 'test', { title: 'Hello World' })
    const resolver = new RecordFieldResolver({ record })
    expect(evaluateRule('title ~ "world"', resolver)).toBe(true)
    expect(evaluateRule('title ~ "foo"', resolver)).toBe(false)
  })

  it('should evaluate AND/OR logic', () => {
    const record = new PBRecord('col1', 'test', { a: 1, b: 2 })
    const resolver = new RecordFieldResolver({ record })
    expect(evaluateRule('a = 1 && b = 2', resolver)).toBe(true)
    expect(evaluateRule('a = 1 && b = 3', resolver)).toBe(false)
    expect(evaluateRule('a = 1 || b = 3', resolver)).toBe(true)
  })

  it('should evaluate negation', () => {
    const record = new PBRecord('col1', 'test', { status: 'active' })
    const resolver = new RecordFieldResolver({ record })
    expect(evaluateRule('!(status = "inactive")', resolver)).toBe(true)
  })

  it('should evaluate @request.auth rule', () => {
    const authRecord = new PBRecord('auth1', 'users', { email: 'test@example.com' })
    const requestInfo = {
      auth: authRecord,
      isAdmin: false,
      method: 'GET',
      headers: {},
      query: {},
      body: {},
      data: {},
      context: 'list',
    }
    const resolver = new RecordFieldResolver({ requestInfo })
    expect(evaluateRule('@request.auth.id != ""', resolver)).toBe(true)
  })
})
