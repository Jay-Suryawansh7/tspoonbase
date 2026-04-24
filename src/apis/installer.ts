import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { hashPassword } from '../tools/security/crypto'

export function registerInstallerRoutes(app: BaseApp, router: Router): void {
  router.get('/api/installer/check', async (req: Request, res: Response) => {
    try {
      const db = app.db().getDataDB()
      const hasTable = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='_superusers'`).get() as { count: number }
      if (hasTable.count === 0) {
        return res.json({ installed: false })
      }
      const row = db.prepare(`SELECT COUNT(*) as count FROM _superusers`).get() as { count: number }
      res.json({ installed: row.count > 0 })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/installer', async (req: Request, res: Response) => {
    try {
      const { email, password, passwordConfirm } = req.body

      if (!email || !password) {
        return res.status(400).json({ code: 400, message: 'Email and password are required.' })
      }

      if (password !== passwordConfirm) {
        return res.status(400).json({ code: 400, message: 'Passwords do not match.' })
      }

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

      const existing = db.prepare(`SELECT id FROM _superusers WHERE email = ?`).get(email)
      if (existing) {
        return res.status(400).json({ code: 400, message: 'Superuser already exists.' })
      }

      const passwordHash = await hashPassword(password)
      const id = `superuser_${Date.now()}`
      const now = new Date().toISOString()

      db.prepare(
        `INSERT INTO _superusers (id, email, passwordHash, created, updated) VALUES (?, ?, ?, ?, ?)`
      ).run(id, email, passwordHash, now, now)

      res.json({ code: 200, message: 'Installer completed.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })
}
