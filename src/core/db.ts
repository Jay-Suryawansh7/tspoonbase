import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

export const DEFAULT_QUERY_TIMEOUT = 30

export interface DBConfig {
  dataDir: string
  isDev: boolean
  queryTimeout?: number
  maxOpenConns?: number
  maxIdleConns?: number
}

export class DB {
  private dataDB: Database.Database
  private auxDB: Database.Database
  private dataDir: string
  private isDev: boolean

  constructor(config: DBConfig) {
    this.dataDir = config.dataDir
    this.isDev = config.isDev

    fs.mkdirSync(this.dataDir, { recursive: true })

    this.dataDB = new Database(path.join(this.dataDir, 'data.db'))
    this.auxDB = new Database(path.join(this.dataDir, 'auxiliary.db'))

    this.dataDB.pragma('journal_mode = WAL')
    this.dataDB.pragma('busy_timeout = 5000')
    this.dataDB.pragma('foreign_keys = ON')

    this.auxDB.pragma('journal_mode = WAL')
    this.auxDB.pragma('busy_timeout = 5000')
    this.auxDB.pragma('foreign_keys = ON')

    // Register vector cosine similarity function for semantic search
    const cosineSimilarity = (aJson: string, bJson: string): number | null => {
      try {
        const a = JSON.parse(aJson) as number[]
        const b = JSON.parse(bJson) as number[]
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null
        let dot = 0, normA = 0, normB = 0
        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i]
          normA += a[i] * a[i]
          normB += b[i] * b[i]
        }
        if (normA === 0 || normB === 0) return null
        return dot / (Math.sqrt(normA) * Math.sqrt(normB))
      } catch {
        return null
      }
    }
    this.dataDB.function('vector_cosine_similarity', { deterministic: true }, cosineSimilarity)
  }

  getDataDB(): Database.Database {
    return this.dataDB
  }

  getAuxDB(): Database.Database {
    return this.auxDB
  }

  hasTable(tableName: string, db: 'data' | 'aux' = 'data'): boolean {
    const database = db === 'data' ? this.dataDB : this.auxDB
    const result = database.prepare(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type IN ('table', 'view') AND LOWER(name) = LOWER(?)`
    ).get(tableName) as { count: number }
    return result.count > 0
  }

  tableColumns(tableName: string, db: 'data' | 'aux' = 'data'): string[] {
    const database = db === 'data' ? this.dataDB : this.auxDB
    const rows = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
    return rows.map(r => r.name)
  }

  tableInfo(tableName: string, db: 'data' | 'aux' = 'data'): Array<{ cid: number; name: string; type: string; notnull: number; dflt_value: any; pk: number }> {
    const database = db === 'data' ? this.dataDB : this.auxDB
    return database.prepare(`PRAGMA table_info(${tableName})`).all() as any[]
  }

  tableIndexes(tableName: string, db: 'data' | 'aux' = 'data'): Record<string, string> {
    const database = db === 'data' ? this.dataDB : this.auxDB
    const rows = database.prepare(`PRAGMA index_list(${tableName})`).all() as Array<{ name: string; sql: string | null }>
    const result: Record<string, string> = {}
    for (const row of rows) {
      if (row.sql) {
        result[row.name] = row.sql
      }
    }
    return result
  }

  deleteTable(tableName: string, db: 'data' | 'aux' = 'data'): void {
    const database = db === 'data' ? this.dataDB : this.auxDB
    database.exec(`DROP TABLE IF EXISTS ${tableName}`)
  }

  deleteView(viewName: string, db: 'data' | 'aux' = 'data'): void {
    const database = db === 'data' ? this.dataDB : this.auxDB
    database.exec(`DROP VIEW IF EXISTS ${viewName}`)
  }

  saveView(viewName: string, selectQuery: string, db: 'data' | 'aux' = 'data'): void {
    const database = db === 'data' ? this.dataDB : this.auxDB
    database.exec(`DROP VIEW IF EXISTS ${viewName}`)
    database.exec(`CREATE VIEW ${viewName} AS ${selectQuery}`)
  }

  vacuum(db: 'data' | 'aux' = 'data'): void {
    const database = db === 'data' ? this.dataDB : this.auxDB
    database.exec('VACUUM')
  }

  transaction<T>(fn: (db: DB) => T): T {
    return this.dataDB.transaction(() => fn(this))()
  }

  close(): void {
    this.dataDB.close()
    this.auxDB.close()
  }
}
