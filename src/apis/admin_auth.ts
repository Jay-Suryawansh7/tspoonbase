import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { verifyPassword, generateJWT } from '../tools/security/crypto'

export function registerAdminAuthRoutes(app: BaseApp, router: Router): void {
  router.post('/api/admins/auth-with-password', async (req: Request, res: Response) => {
    try {
      const { identity, password } = req.body
      if (!identity || !password) {
        return res.status(400).json({ code: 400, message: 'Missing identity or password.' })
      }

      const db = app.db().getDataDB()
      const hasTable = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='_superusers'`).get() as { count: number }
      if (hasTable.count === 0) {
        return res.status(400).json({ code: 400, message: 'No superusers found.' })
      }

      const row = db.prepare(`SELECT * FROM _superusers WHERE email = ?`).get(identity) as any
      if (!row) {
        return res.status(400).json({ code: 400, message: 'Invalid credentials.' })
      }

      const valid = await verifyPassword(password, row.passwordHash)
      if (!valid) {
        return res.status(400).json({ code: 400, message: 'Invalid credentials.' })
      }

      const token = app.generateJWT(
        { id: row.id, type: 'admin' },
        app.settings().appName || 'secret',
        '720h'
      )

      res.json({ token, admin: { id: row.id, email: row.email } })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })
}
