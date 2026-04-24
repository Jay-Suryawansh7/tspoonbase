import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { requireSuperuserAuth } from './middlewares_auth'
import { SettingsEncryption } from '../core/settings_encrypt'
import { Mailer } from '../tools/mailer/mailer'
import { EmailTemplateEngine, sendVerificationEmail } from '../tools/mailer/templates'

export function registerSettingsRoutes(app: BaseApp, router: Router): void {
  const settingsRouter = Router()
  const encryption = new SettingsEncryption(app)

  settingsRouter.get('/', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      const settings = app.settings()
      res.json(settings)
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  settingsRouter.patch('/', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      let settings = { ...app.settings(), ...req.body }

      // Encrypt sensitive fields before saving
      settings = encryption.encryptSettings(settings)

      const db = app.db().getDataDB()
      const now = new Date().toISOString()
      db.prepare("UPDATE _settings SET value = ?, updated = ? WHERE key = 'main'").run(
        JSON.stringify(settings), now
      )
      await app.reloadSettings()
      res.json(app.settings())
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  settingsRouter.post('/test/email', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      const { to } = req.body
      const settings = app.settings()

      if (!settings.smtp.host) {
        return res.status(400).json({ code: 400, message: 'SMTP not configured.' })
      }

      const mailer = Mailer.fromSettings(settings)
      const engine = new EmailTemplateEngine(settings)

      await sendVerificationEmail(mailer, engine, to, {
        verificationURL: `${settings.appURL}/_/#/auth/verify/test`,
      })

      res.json({ success: true, message: `Test email sent to ${to}.` })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  settingsRouter.post('/test/s3', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      const settings = app.settings()
      if (!settings.s3.enabled) {
        return res.status(400).json({ code: 400, message: 'S3 not enabled.' })
      }
      res.json({ success: true, message: 'S3 connection test not fully implemented yet.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.use('/api/settings', settingsRouter)
}
