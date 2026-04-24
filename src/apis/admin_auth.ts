import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { verifyPassword, generateJWT, hashPassword as hashPasswordAsync } from '../tools/security/crypto'
import { Mailer } from '../tools/mailer/mailer'
import { EmailTemplateEngine, sendPasswordResetEmail } from '../tools/mailer/templates'

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

  router.post('/api/admins/refresh', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ code: 401, message: 'Missing authorization header.' })
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      const payload = app.parseJWT(token, app.settings().appName || 'secret')
      if (!payload || payload.type !== 'admin') {
        return res.status(401).json({ code: 401, message: 'Invalid or expired token.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _superusers WHERE id = ?`).get(payload.id) as any
      if (!row) {
        return res.status(401).json({ code: 401, message: 'Admin not found.' })
      }

      const newToken = app.generateJWT(
        { id: row.id, type: 'admin' },
        app.settings().appName || 'secret',
        '720h'
      )

      res.json({ token: newToken, admin: { id: row.id, email: row.email } })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/admins/request-password-reset', async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({ code: 400, message: 'Missing email.' })
      }

      const db = app.db().getDataDB()
      const hasTable = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='_superusers'`).get() as { count: number }
      if (hasTable.count === 0) {
        return res.status(204).send()
      }

      const row = db.prepare(`SELECT * FROM _superusers WHERE email = ?`).get(email) as any
      if (!row) {
        return res.status(204).send()
      }

      const token = app.generateJWT(
        { id: row.id, type: 'adminPasswordReset' },
        app.settings().appName || 'secret',
        '1h'
      )

      // Send email if SMTP is configured
      try {
        const settings = app.settings()
        if (settings.smtp.host) {
          const mailer = Mailer.fromSettings(settings)
          const engine = new EmailTemplateEngine(settings)
          await sendPasswordResetEmail(mailer, engine, email, {
            resetURL: `${settings.appURL}/_/#/admin/confirm-password-reset?token=${token}`,
            userName: row.email,
          })
        }
      } catch (emailErr: any) {
        app.logger().warn('Failed to send admin password reset email', emailErr.message)
      }

      res.json({ code: 200, message: 'Password reset email sent.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/admins/confirm-password-reset', async (req: Request, res: Response) => {
    try {
      const { token, password, passwordConfirm } = req.body
      if (!token || !password) {
        return res.status(400).json({ code: 400, message: 'Missing token or password.' })
      }
      if (password !== passwordConfirm) {
        return res.status(400).json({ code: 400, message: 'Passwords do not match.' })
      }

      const payload = app.parseJWT(token, app.settings().appName || 'secret')
      if (!payload || payload.type !== 'adminPasswordReset') {
        return res.status(400).json({ code: 400, message: 'Invalid or expired token.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _superusers WHERE id = ?`).get(payload.id) as any
      if (!row) {
        return res.status(400).json({ code: 400, message: 'Invalid token.' })
      }

      const passwordHash = await hashPasswordAsync(password)
      db.prepare(`UPDATE _superusers SET passwordHash = ? WHERE id = ?`).run(passwordHash, payload.id)

      res.json({ code: 200, message: 'Password reset successfully.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })
}
