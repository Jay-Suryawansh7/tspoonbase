import { BaseApp } from '../core/base'

export interface Migration {
  id: string
  up: (app: BaseApp) => Promise<void>
  down?: (app: BaseApp) => Promise<void>
}

export class MigrationRunner {
  private app: BaseApp
  private migrations: Migration[] = []

  constructor(app: BaseApp) {
    this.app = app
  }

  add(migration: Migration): void {
    this.migrations.push(migration)
  }

  async run(): Promise<void> {
    if (!this.app.isBootstrapped()) {
      throw new Error('App must be bootstrapped before running migrations')
    }

    const db = this.app.db().getDataDB()

    db.exec(`
      CREATE TABLE IF NOT EXISTS _applied_migrations (
        id TEXT PRIMARY KEY,
        applied TEXT NOT NULL
      )
    `)

    const applied = db.prepare('SELECT id FROM _applied_migrations').all() as Array<{ id: string }>
    const appliedIds = new Set(applied.map(a => a.id))

    for (const migration of this.migrations) {
      if (appliedIds.has(migration.id)) continue

      try {
        await migration.up(this.app)

        const now = new Date().toISOString()
        db.prepare('INSERT INTO _applied_migrations (id, applied) VALUES (?, ?)').run(migration.id, now)

        console.log(`Migration applied: ${migration.id}`)
      } catch (err) {
        console.error(`Migration failed: ${migration.id}`, err)
        throw err
      }
    }
  }

  async rollback(count = 1): Promise<void> {
    if (!this.app.isBootstrapped()) {
      throw new Error('App must be bootstrapped before rolling back migrations')
    }

    const db = this.app.db().getDataDB()

    const applied = db.prepare('SELECT id FROM _applied_migrations ORDER BY applied DESC LIMIT ?').all(count) as Array<{ id: string }>

    for (const { id } of applied) {
      const migration = this.migrations.find(m => m.id === id)
      if (migration && migration.down) {
        try {
          await migration.down(this.app)
          db.prepare('DELETE FROM _applied_migrations WHERE id = ?').run(id)
          console.log(`Migration rolled back: ${id}`)
        } catch (err) {
          console.error(`Migration rollback failed: ${id}`, err)
          throw err
        }
      }
    }
  }

  status(): { id: string; applied: boolean; appliedAt?: string }[] {
    if (!this.app.isBootstrapped()) {
      throw new Error('App must be bootstrapped before checking migration status')
    }

    const db = this.app.db().getDataDB()
    const appliedRows = db.prepare('SELECT id, applied FROM _applied_migrations').all() as Array<{ id: string; applied: string }>
    const appliedMap = new Map(appliedRows.map(r => [r.id, r.applied]))

    return this.migrations.map(m => ({
      id: m.id,
      applied: appliedMap.has(m.id),
      appliedAt: appliedMap.get(m.id),
    }))
  }

  list(): Migration[] {
    return [...this.migrations]
  }

  isApplied(id: string): boolean {
    if (!this.app.isBootstrapped()) return false
    const db = this.app.db().getDataDB()
    const row = db.prepare('SELECT id FROM _applied_migrations WHERE id = ?').get(id) as { id: string } | undefined
    return !!row
  }
}
