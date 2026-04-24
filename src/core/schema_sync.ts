import { BaseApp } from './base'
import { Collection } from './collection'
import { Field } from './field'

export interface SchemaSyncResult {
  changed: boolean
  addedColumns: string[]
  removedColumns: string[]
  modifiedColumns: string[]
}

export async function syncRecordTableSchema(
  app: BaseApp,
  collection: Collection
): Promise<SchemaSyncResult> {
  if (collection.isView()) {
    return syncViewCollection(app, collection)
  }

  if (!collection.isBase() && !collection.isAuth()) {
    return { changed: false, addedColumns: [], removedColumns: [], modifiedColumns: [] }
  }

  const db = app.db().getDataDB()
  const tableName = `_r_${collection.id}`

  // Get existing columns
  const existingColumns = getExistingColumns(db, tableName)
  const existingColumnNames = new Set(existingColumns.map(c => c.name))

  // Build expected columns
  const expectedColumns = buildExpectedColumns(collection)

  const result: SchemaSyncResult = {
    changed: false,
    addedColumns: [],
    removedColumns: [],
    modifiedColumns: [],
  }

  // Add missing columns
  for (const [colName, colDef] of Object.entries(expectedColumns)) {
    if (!existingColumnNames.has(colName)) {
      try {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colDef}`)
        result.addedColumns.push(colName)
        result.changed = true
      } catch (err: any) {
        app.logger().error(`Failed to add column ${colName} to ${tableName}`, err.message)
      }
    }
  }

  // Note: SQLite doesn't support DROP COLUMN easily in older versions,
  // so we log removed columns but don't actually remove them to avoid data loss
  for (const col of existingColumns) {
    if (!expectedColumns[col.name] && !isSystemColumn(col.name)) {
      result.removedColumns.push(col.name)
      // We don't drop columns to preserve data, but we could rebuild the table if needed
    }
  }

  // Update indexes
  await syncIndexes(app, collection)

  return result
}

export async function createRecordTable(app: BaseApp, collection: Collection): Promise<void> {
  if (collection.isView()) {
    await syncViewCollection(app, collection)
    return
  }

  if (!collection.isBase() && !collection.isAuth()) return

  const db = app.db().getDataDB()
  const tableName = `_r_${collection.id}`

  const columns = buildExpectedColumns(collection)
  const columnDefs = Object.entries(columns).map(([name, def]) => `${name} ${def}`)

  db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs.join(', ')})`)

  await syncIndexes(app, collection)
}

async function syncViewCollection(app: BaseApp, collection: Collection): Promise<SchemaSyncResult> {
  const db = app.db().getDataDB()
  const viewName = `_r_${collection.id}`

  // Drop existing view if query changed
  try {
    db.exec(`DROP VIEW IF EXISTS ${viewName}`)
  } catch {
    // view might not exist
  }

  const query = collection.viewOptions?.query
  if (query) {
    try {
      db.exec(`CREATE VIEW ${viewName} AS ${query}`)
    } catch (err: any) {
      app.logger().error(`Failed to create view ${viewName}`, err.message)
    }
  }

  return { changed: false, addedColumns: [], removedColumns: [], modifiedColumns: [] }
}

function getExistingColumns(db: any, tableName: string): Array<{ name: string; type: string }> {
  try {
    return db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string; type: string }>
  } catch {
    return []
  }
}

function isSystemColumn(name: string): boolean {
  return ['id', 'created', 'updated', 'collectionId', 'collectionName'].includes(name)
}

function buildExpectedColumns(collection: Collection): Record<string, string> {
  const columns: Record<string, string> = {
    id: 'TEXT PRIMARY KEY',
    created: 'TEXT',
    updated: 'TEXT',
    collectionId: 'TEXT',
    collectionName: 'TEXT',
  }

  if (collection.isAuth()) {
    columns.email = 'TEXT UNIQUE'
    columns.emailVisibility = 'INTEGER DEFAULT 1'
    columns.passwordHash = 'TEXT'
    columns.verified = 'INTEGER DEFAULT 0'
    columns.lastResetSentAt = 'TEXT'
    columns.lastVerificationSentAt = 'TEXT'
    columns.username = 'TEXT'
    columns.lastLoginAt = 'TEXT'
  }

  for (const field of collection.fields) {
    columns[field.name] = getSQLiteType(field)
  }

  return columns
}

function getSQLiteType(field: Field): string {
  switch (field.type) {
    case 'number':
      return 'REAL'
    case 'bool':
      return 'INTEGER DEFAULT 0'
    case 'json':
      return 'TEXT'
    case 'file':
      return 'TEXT'
    case 'relation':
      return 'TEXT'
    case 'select':
      return 'TEXT'
    case 'date':
      return 'TEXT'
    case 'email':
      return 'TEXT'
    case 'url':
      return 'TEXT'
    case 'editor':
      return 'TEXT'
    case 'geoPoint':
      return 'TEXT'
    case 'vector':
      return 'TEXT'
    case 'autodate':
      return 'TEXT'
    default:
      return 'TEXT'
  }
}

async function syncIndexes(app: BaseApp, collection: Collection): Promise<void> {
  const db = app.db().getDataDB()
  const tableName = `_r_${collection.id}`

  // Get existing indexes
  const existingIndexes = db.prepare(`PRAGMA index_list(${tableName})`).all() as Array<{ name: string }>
  const existingIndexNames = new Set(existingIndexes.map(i => i.name))

  // Create indexes from collection definition
  for (const indexDef of collection.indexes) {
    const indexName = `idx_${collection.id}_${createHash('md5').update(indexDef).digest('hex').slice(0, 8)}`
    if (!existingIndexNames.has(indexName)) {
      try {
        // Simple index parsing - expect format like "CREATE INDEX ..." or "field1, field2"
        if (indexDef.toUpperCase().startsWith('CREATE')) {
          db.exec(indexDef)
        } else {
          const fields = indexDef.split(',').map(f => f.trim()).join(', ')
          db.exec(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${fields})`)
        }
      } catch (err: any) {
        app.logger().error(`Failed to create index ${indexName}`, err.message)
      }
    }
  }
}

import { createHash } from 'crypto'
