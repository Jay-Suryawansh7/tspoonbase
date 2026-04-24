import { describe, it, expect, beforeEach } from 'vitest'
import { BaseApp } from '../src/core/base'
import { Collection } from '../src/core/collection'
import { RecordModel as PBRecord } from '../src/core/record'
import { RecordUpsertForm, validateAndCreateRecord, validateAndUpdateRecord } from '../src/core/record_upsert'

describe('RecordUpsertForm', () => {
  let app: BaseApp
  let collection: Collection

  beforeEach(async () => {
    const dataDir = `./test_data_upsert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()

    collection = new Collection({
      name: 'upsert_test',
      type: 'base',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { id: 'fld1', name: 'title', type: 'text', system: false, required: true, presentable: true, hidden: false },
        { id: 'fld2', name: 'count', type: 'number', system: false, required: false, presentable: true, hidden: false, max: 100 },
        { id: 'fld3', name: 'email', type: 'email', system: false, required: false, presentable: true, hidden: false },
      ],
      indexes: [],
    })

    await app.save(collection)
  })

  it('should validate required fields', () => {
    const form = new RecordUpsertForm(app, {
      data: { count: 10 },
      collection,
    })
    const errors = form.validate()
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('title')
  })

  it('should pass validation with valid data', () => {
    const form = new RecordUpsertForm(app, {
      data: { title: 'Test', count: 10 },
      collection,
    })
    expect(form.isValid()).toBe(true)
  })

  it('should validate email format', () => {
    const form = new RecordUpsertForm(app, {
      data: { title: 'Test', email: 'invalid-email' },
      collection,
    })
    const errors = form.validate()
    expect(errors.some(e => e.field === 'email')).toBe(true)
  })

  it('should build a record from data', () => {
    const form = new RecordUpsertForm(app, {
      data: { title: 'Test', count: 10 },
      collection,
    })
    const record = form.buildRecord()
    expect(record.get('title')).toBe('Test')
    expect(record.get('count')).toBe(10)
  })

  it('should validate auth collection password', async () => {
    const authCollection = new Collection({
      name: 'users',
      type: 'auth',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { id: 'fld1', name: 'name', type: 'text', system: false, required: false, presentable: true, hidden: false },
      ],
      indexes: [],
      authOptions: {
        allowEmailAuth: true,
        allowOAuth2Auth: false,
        allowUsernameAuth: false,
        exceptEmailDomains: [],
        manageRule: null,
        minPasswordLength: 8,
        onlyEmailDomains: [],
        onlyVerified: false,
        requireEmail: false,
        usernameField: 'username',
      },
    })

    await app.save(authCollection)

    const form = new RecordUpsertForm(app, {
      data: { email: 'test@example.com', password: 'short' },
      collection: authCollection,
    })
    const errors = form.validate()
    expect(errors.some(e => e.field === 'password')).toBe(true)
  })
})

describe('validateAndCreateRecord', () => {
  let app: BaseApp
  let collection: Collection

  beforeEach(async () => {
    const dataDir = `./test_data_upsert2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()

    collection = new Collection({
      name: 'create_test',
      type: 'base',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { id: 'fld1', name: 'title', type: 'text', system: false, required: true, presentable: true, hidden: false },
      ],
      indexes: [],
    })

    await app.save(collection)
  })

  it('should create a valid record', async () => {
    const { record, errors } = await validateAndCreateRecord(app, collection, { title: 'Test' })
    expect(errors).toHaveLength(0)
    expect(record).toBeTruthy()
    expect(record.get('title')).toBe('Test')
  })

  it('should return validation errors for invalid data', async () => {
    const { record, errors } = await validateAndCreateRecord(app, collection, {})
    expect(errors).toHaveLength(1)
    expect(record).toBeNull()
  })
})

describe('RecordUpsertForm modifiers', () => {
  let app: BaseApp
  let collection: Collection

  beforeEach(async () => {
    const dataDir = `./test_data_modifiers_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()

    collection = new Collection({
      name: 'modifier_test',
      type: 'base',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { id: 'fld1', name: 'title', type: 'text', system: false, required: false, presentable: true, hidden: false },
        { id: 'fld2', name: 'tags', type: 'select', system: false, required: false, presentable: true, hidden: false, values: ['a', 'b', 'c', 'd'] },
      ],
      indexes: [],
    })

    await app.save(collection)
  })

  it('should append to array with +field modifier', () => {
    const existingRecord = new PBRecord(collection.id, collection.name, { id: 'r1', collectionId: collection.id, collectionName: collection.name, title: 'Test', tags: ['a', 'b'] })
    const form = new RecordUpsertForm(app, {
      data: { '+tags': ['c', 'd'] },
      collection,
      record: existingRecord,
    })
    const record = form.buildRecord()
    expect(record.get('tags')).toEqual(['a', 'b', 'c', 'd'])
  })

  it('should remove from array with field- modifier', () => {
    const existingRecord = new PBRecord(collection.id, collection.name, { id: 'r1', collectionId: collection.id, collectionName: collection.name, title: 'Test', tags: ['a', 'b', 'c'] })
    const form = new RecordUpsertForm(app, {
      data: { 'tags-': ['b'] },
      collection,
      record: existingRecord,
    })
    const record = form.buildRecord()
    expect(record.get('tags')).toEqual(['a', 'c'])
  })

  it('should append single value with +field modifier', () => {
    const existingRecord = new PBRecord(collection.id, collection.name, { id: 'r1', collectionId: collection.id, collectionName: collection.name, title: 'Test', tags: ['a'] })
    const form = new RecordUpsertForm(app, {
      data: { '+tags': 'b' },
      collection,
      record: existingRecord,
    })
    const record = form.buildRecord()
    expect(record.get('tags')).toEqual(['a', 'b'])
  })
})
