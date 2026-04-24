import { BaseApp } from '../core/base'
import { hashPassword } from '../tools/security/crypto'

interface SuperuserOptions {
  email?: string
  password?: string
  dataDir: string
}

export async function createSuperuser(opts: SuperuserOptions): Promise<void> {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = (prompt: string): Promise<string> => {
    return new Promise(resolve => rl.question(prompt, resolve))
  }

  try {
    let email = opts.email
    let password = opts.password

    if (!email) {
      email = await question('Email: ')
    }

    if (!password) {
      password = await question('Password: ')
    }

    rl.close()

    const app = new BaseApp({
      isDev: false,
      dataDir: opts.dataDir,
    })

    await app.bootstrap()
    await app.runSystemMigrations()

    const db = app.db().getDataDB()

    db.exec(`
      CREATE TABLE IF NOT EXISTS _superusers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `)

    const passwordHash = await hashPassword(password!)
    const id = `superuser_${Date.now()}`
    const now = new Date().toISOString()

    db.prepare(
      `INSERT OR REPLACE INTO _superusers (id, email, passwordHash, created, updated) VALUES (?, ?, ?, ?, ?)`
    ).run(id, email!, passwordHash, now, now)

    console.log(`Superuser ${email} created successfully.`)
    process.exit(0)
  } catch (err: any) {
    rl.close()
    console.error('Error creating superuser:', err.message)
    process.exit(1)
  }
}

export function hasSuperuser(app: BaseApp): boolean {
  try {
    const db = app.db().getDataDB()
    const hasTable = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='_superusers'`).get() as { count: number }
    if (hasTable.count === 0) return false
    const row = db.prepare(`SELECT COUNT(*) as count FROM _superusers`).get() as { count: number }
    return row.count > 0
  } catch {
    return false
  }
}
