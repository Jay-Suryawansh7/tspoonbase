import { BaseApp, BaseAppConfig } from './core/base'
import { serve } from './apis/serve'
import { Hook } from './tools/hook/hook'
import { BootstrapEvent } from './core/events'
import { hasSuperuser } from './cmd/superuser'
import path from 'path'
import fs from 'fs'

export interface TspoonBaseConfig {
  hideStartBanner?: boolean
  defaultDev?: boolean
  defaultDataDir?: string
  defaultEncryptionEnv?: string
  defaultQueryTimeout?: number
  dataMaxOpenConns?: number
  dataMaxIdleConns?: number
  auxMaxOpenConns?: number
  auxMaxIdleConns?: number
}

export class TspoonBase extends BaseApp {
  hideStartBanner: boolean
  version: string

  constructor(config: TspoonBaseConfig = {}) {
    const baseConfig: BaseAppConfig = {
      isDev: config.defaultDev ?? false,
      dataDir: config.defaultDataDir ?? './pb_data',
      encryptionEnv: config.defaultEncryptionEnv,
      queryTimeout: config.defaultQueryTimeout,
      dataMaxOpenConns: config.dataMaxOpenConns,
      dataMaxIdleConns: config.dataMaxIdleConns,
      auxMaxOpenConns: config.auxMaxOpenConns,
      auxMaxIdleConns: config.auxMaxIdleConns,
    }
    super(baseConfig)
    this.hideStartBanner = config.hideStartBanner ?? false
    this.version = '0.1.0'
  }

  async start(port = 8090): Promise<void> {
    await this.bootstrap()
    await this.runAllMigrations()
    await this.runJSMigrations()

    const hasAdmin = hasSuperuser(this)
    const installerUrl = `http://localhost:${port}/_/#/install`

    if (!this.hideStartBanner) {
      console.log(`
TspoonBase v${this.version}
Server started at http://localhost:${port}
- REST API: http://localhost:${port}/api/
- Admin UI: http://localhost:${port}/_/
`)
      if (!hasAdmin) {
        console.log(`
========================================
  NO SUPERUSER FOUND
  Complete installation at:
  ${installerUrl}
  
  Or run: ./tspoonbase superuser-create EMAIL PASS
========================================
`)
      }
    }

    await serve(this, port)
  }

  private async runJSMigrations(): Promise<void> {
    const migrationsDir = path.join(process.cwd(), 'pb_migrations')
    if (!fs.existsSync(migrationsDir)) return

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort()

    const db = this.db().getDataDB()
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied TEXT NOT NULL
      )
    `)

    for (const file of files) {
      const migrationId = file.replace(/\.js$/, '')
      const applied = db.prepare('SELECT id FROM _migrations WHERE id = ?').get(migrationId)
      if (applied) continue

      try {
        const fullPath = path.join(migrationsDir, file)
        const migrationModule = require(fullPath)
        if (typeof migrationModule.up === 'function') {
          await migrationModule.up(this)
        }

        const now = new Date().toISOString()
        db.prepare('INSERT INTO _migrations (id, applied) VALUES (?, ?)').run(migrationId, now)
        console.log(`JS migration applied: ${migrationId}`)
      } catch (err: any) {
        console.error(`JS migration failed: ${migrationId}`, err.message)
      }
    }
  }
}

export function newTspoonBase(config?: TspoonBaseConfig): TspoonBase {
  return new TspoonBase(config)
}
