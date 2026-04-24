import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { RecordModel as PBRecord } from '../core/record'
import { Collection } from '../core/collection'
import { hashPassword, verifyPassword, generateJWT, parseJWT, generateRandomString } from '../tools/security/crypto'
import { DateTime } from '../tools/types/types'
import { oauth2Registry, handleOAuth2Callback, linkExternalAuth } from '../tools/auth/oauth2'

export function registerAuthRoutes(app: BaseApp, router: Router): void {
  const authRouter = Router({ mergeParams: true })

  authRouter.post('/auth-with-password', async (req: Request, res: Response) => {
    try {
      const { identity, password, collectionIdOrName } = req.body
      if (!identity || !password) {
        return res.status(400).json({ code: 400, message: 'Missing identity or password.' })
      }

      const collection = await app.findCollectionByNameOrId(collectionIdOrName ?? 'users')
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      const db = app.db().getDataDB()
      const columns = db.prepare(`PRAGMA table_info(_r_${collection.id})`).all() as Array<{ name: string }>
      const hasUsername = columns.some(c => c.name === 'username')

      let row: any
      if (hasUsername) {
        row = db.prepare(
          `SELECT * FROM _r_${collection.id} WHERE email = ? OR username = ?`
        ).get(identity, identity) as any
      } else {
        row = db.prepare(
          `SELECT * FROM _r_${collection.id} WHERE email = ?`
        ).get(identity) as any
      }

      if (!row) {
        return res.status(400).json({ code: 400, message: 'Invalid login credentials.' })
      }

      const passwordHash = row.passwordHash
      const valid = await verifyPassword(password, passwordHash)
      if (!valid) {
        return res.status(400).json({ code: 400, message: 'Invalid login credentials.' })
      }

      // Check onlyVerified option
      if (collection.authOptions?.onlyVerified && !row.verified) {
        return res.status(403).json({ code: 403, message: 'Email not verified.' })
      }

      const record = new PBRecord(collection.id, collection.name, row)
      const token = app.generateJWT(
        { id: record.id, type: 'auth', collectionId: collection.id },
        app.settings().appName || 'secret',
        '720h'
      )

      // Update lastLoginAt
      db.prepare(`UPDATE _r_${collection.id} SET lastLoginAt = ? WHERE id = ?`).run(new Date().toISOString(), record.id)

      res.json({ token, record: record.toJSON() })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/auth-with-oauth2', async (req: Request, res: Response) => {
    try {
      const { provider, code, codeVerifier, redirectURL, createData } = req.body
      const collectionIdOrName = req.params.collectionIdOrName ?? 'users'

      if (!provider || !code) {
        return res.status(400).json({ code: 400, message: 'Missing provider or code.' })
      }

      const collection = await app.findCollectionByNameOrId(collectionIdOrName)
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      if (!collection.authOptions?.allowOAuth2Auth) {
        return res.status(403).json({ code: 403, message: 'OAuth2 is not enabled for this collection.' })
      }

      const { user: oauthUser } = await handleOAuth2Callback(app, provider, code, codeVerifier, redirectURL)

      const db = app.db().getDataDB()

      // Check if external auth already exists
      const existingAuth = db.prepare(
        `SELECT * FROM _externalAuths WHERE provider = ? AND providerId = ?`
      ).get(provider, oauthUser.id) as any

      let record: PBRecord

      if (existingAuth) {
        // Existing user - find their record
        const row = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(existingAuth.recordRef) as any
        if (!row) {
          return res.status(400).json({ code: 400, message: 'Associated record not found.' })
        }
        record = new PBRecord(collection.id, collection.name, row)
      } else {
        // New user - check if email exists
        if (oauthUser.email) {
          const existingRow = db.prepare(`SELECT * FROM _r_${collection.id} WHERE email = ?`).get(oauthUser.email) as any
          if (existingRow) {
            // Link external auth to existing account
            record = new PBRecord(collection.id, collection.name, existingRow)
            await linkExternalAuth(app, record, provider, oauthUser.id)
          } else {
            // Create new record
            const data: any = {
              collectionId: collection.id,
              collectionName: collection.name,
              email: oauthUser.email,
              emailVisibility: true,
              verified: true,
              name: oauthUser.name,
              ...createData,
            }
            record = new PBRecord(collection.id, collection.name, data)
            await app.save(record)
            await linkExternalAuth(app, record, provider, oauthUser.id)
          }
        } else {
          return res.status(400).json({ code: 400, message: 'OAuth2 provider did not return email.' })
        }
      }

      const token = app.generateJWT(
        { id: record.id, type: 'auth', collectionId: collection.id },
        app.settings().appName || 'secret',
        '720h'
      )

      res.json({ token, record: record.toJSON(), meta: { isNew: !existingAuth } })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/auth-with-otp', async (req: Request, res: Response) => {
    try {
      const { otpId, password, collectionIdOrName } = req.body
      res.status(501).json({ code: 501, message: 'OTP auth not fully implemented yet.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/request-otp', async (req: Request, res: Response) => {
    try {
      const { email, collectionIdOrName } = req.body
      res.status(501).json({ code: 501, message: 'OTP request not fully implemented yet.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { token } = req.body
      const secret = app.settings().senderAddress || 'secret'
      const payload = app.parseJWT(token, secret)
      if (!payload || payload.type !== 'auth') {
        return res.status(401).json({ code: 401, message: 'Invalid token.' })
      }

      const newToken = app.generateJWT(
        { id: payload.id, type: 'auth', collectionId: payload.collectionId },
        app.settings().appName || 'secret',
        '720h'
      )

      res.json({ token: newToken })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.get('/methods', async (req: Request, res: Response) => {
    try {
      const collections = await app.findAllCollections(['auth'])
      const authMethods = collections.map(c => ({
        name: c.name,
        collectionId: c.id,
        allowPasswordAuth: c.authOptions?.allowEmailAuth ?? true,
        allowOAuth2Auth: c.authOptions?.allowOAuth2Auth ?? false,
        allowOTPAuth: false,
        oauth2Providers: oauth2Registry.list().map(p => ({
          name: p.name,
          displayName: p.displayName,
          authURL: p.getAuthURL(''),
          pkce: p.pkce,
        })),
      }))

      res.json({ authMethods, mfa: { enabled: false }, otp: { enabled: false } })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  // List linked external auths
  authRouter.get('/external-auths', async (req: Request, res: Response) => {
    try {
      const collectionIdOrName = req.params.collectionIdOrName
      const collection = await app.findCollectionByNameOrId(collectionIdOrName)
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ code: 401, message: 'Authentication required.' })
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      const payload = app.parseJWT(token, app.settings().appName || 'secret')
      if (!payload || payload.type !== 'auth') {
        return res.status(401).json({ code: 401, message: 'Invalid token.' })
      }

      const db = app.db().getDataDB()
      const rows = db.prepare(
        `SELECT * FROM _externalAuths WHERE recordRef = ? AND collectionId = ?`
      ).all(payload.id, collection.id) as any[]

      res.json(rows.map(r => ({
        id: r.id,
        recordRef: r.recordRef,
        collectionId: r.collectionId,
        provider: r.provider,
        providerId: r.providerId,
        created: r.created,
        updated: r.updated,
      })))
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.use('/api/collections/:collectionIdOrName', authRouter)
}
