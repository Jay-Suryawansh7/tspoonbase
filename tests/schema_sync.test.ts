import { describe, it, expect, beforeEach } from 'vitest'
import { BaseApp } from '../src/core/base'
import { Collection } from '../src/core/collection'
import { syncRecordTableSchema, createRecordTable } from '../src/core/schema_sync'

describe('Schema Sync', () => {
  let app: BaseApp

  beforeEach(async () => {
    const dataDir = `./test_data_sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()
  })

  it('should create record table for base collection', async () => {
    const collection = new Collection({
      name: 'sync_test',
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
    await createRecordTable(app, collection)

    const db = app.db().getDataDB()
    const tableName = `_r_${collection.id}`
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").all(tableName)
    expect(tables).toHaveLength(1)
  })

  it('should sync schema and add missing columns', async () => {
    const collection = new Collection({
      name: 'sync_test2',
      type: 'base',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { id: 'fld1', name: 'title', type: 'text', system: false, required: false, presentable: true, hidden: false },
      ],
      indexes: [],
    })

    await app.save(collection)
    await createRecordTable(app, collection)

    // Add a new field
    collection.fields.push(
      { id: 'fld2', name: 'description', type: 'text', system: false, required: false, presentable: true, hidden: false }
    )

    const result = await syncRecordTableSchema(app, collection)
    expect(result.changed).toBe(true)
    expect(result.addedColumns).toContain('description')
  })

  it('should not modify view collections', async () => {
    const collection = new Collection({
      name: 'view_test',
      type: 'view',
      system: false,
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [],
      indexes: [],
      viewOptions: { query: 'SELECT * FROM _collections' },
    })

    await app.save(collection)
    const result = await syncRecordTableSchema(app, collection)
    expect(result.changed).toBe(false)
  })
})
