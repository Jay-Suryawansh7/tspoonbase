import { describe, it, expect, beforeEach } from 'vitest'
import { BaseApp } from '../src/core/base'
import { Collection } from '../src/core/collection'
import { RecordModel as PBRecord } from '../src/core/record'
import {
  findRecordById,
  findRecordsByIds,
  findAllRecords,
  findFirstRecordByFilter,
  findRecordsByFilter,
  countRecords,
  findAuthRecordByEmail,
  findAuthRecordByUsername,
  deleteRecordById,
} from '../src/core/record_query'

describe('Record Query', () => {
  let app: BaseApp

  beforeEach(async () => {
    const dataDir = `./test_data_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()

    // Create a test collection
    const collection = new Collection({
      name: 'test_collection',
      type: 'base',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { id: 'fld1', name: 'title', type: 'text', system: false, required: false, presentable: true, hidden: false },
        { id: 'fld2', name: 'count', type: 'number', system: false, required: false, presentable: true, hidden: false },
      ],
      indexes: [],
    })

    await app.save(collection)

    // Create test records
    const record1 = new PBRecord(collection.id, collection.name, { title: 'First', count: 10 })
    const record2 = new PBRecord(collection.id, collection.name, { title: 'Second', count: 20 })
    const record3 = new PBRecord(collection.id, collection.name, { title: 'Third', count: 30 })

    await app.save(record1)
    await app.save(record2)
    await app.save(record3)
  })

  it('should find record by id', async () => {
    const all = await findAllRecords(app, 'test_collection')
    const first = all.items[0]

    const found = await findRecordById(app, 'test_collection', first.id)
    expect(found).toBeTruthy()
    expect(found?.get('title')).toBe(first.get('title'))
  })

  it('should return null for non-existent record', async () => {
    const found = await findRecordById(app, 'test_collection', 'non-existent')
    expect(found).toBeNull()
  })

  it('should find records by ids', async () => {
    const all = await findAllRecords(app, 'test_collection')
    const ids = all.items.map(r => r.id)

    const found = await findRecordsByIds(app, 'test_collection', ids)
    expect(found).toHaveLength(3)
  })

  it('should find all records with pagination', async () => {
    const result = await findAllRecords(app, 'test_collection', { page: 1, perPage: 2 })
    expect(result.items).toHaveLength(2)
    expect(result.totalItems).toBe(3)
    expect(result.totalPages).toBe(2)
  })

  it('should filter records', async () => {
    const result = await findAllRecords(app, 'test_collection', {
      filter: 'count >= 20',
    })
    expect(result.items).toHaveLength(2)
  })

  it('should sort records', async () => {
    const result = await findAllRecords(app, 'test_collection', {
      sort: '-count',
    })
    expect(result.items[0].get('count')).toBe(30)
    expect(result.items[2].get('count')).toBe(10)
  })

  it('should count records', async () => {
    const count = await countRecords(app, 'test_collection')
    expect(count).toBe(3)
  })

  it('should count records with filter', async () => {
    const count = await countRecords(app, 'test_collection', 'count > 15')
    expect(count).toBe(2)
  })

  it('should find first record by filter', async () => {
    const found = await findFirstRecordByFilter(app, 'test_collection', 'title = "First"')
    expect(found).toBeTruthy()
    expect(found?.get('title')).toBe('First')
  })

  it('should find records by filter with limit', async () => {
    const found = await findRecordsByFilter(app, 'test_collection', 'count >= 10', 'count', 2, 0)
    expect(found).toHaveLength(2)
  })

  it('should delete record by id', async () => {
    const all = await findAllRecords(app, 'test_collection')
    const first = all.items[0]

    const deleted = await deleteRecordById(app, 'test_collection', first.id)
    expect(deleted).toBe(true)

    const found = await findRecordById(app, 'test_collection', first.id)
    expect(found).toBeNull()
  })
})
