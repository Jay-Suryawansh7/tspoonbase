import { Router, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { BaseApp } from '../core/base'
import { RecordModel as PBRecord } from '../core/record'
import { Collection } from '../core/collection'
import { hashPassword, verifyPassword, generateJWT, parseJWT, generateRandomString } from '../tools/security/crypto'
import { DateTime } from '../tools/types/types'
import { oauth2Registry, handleOAuth2Callback, linkExternalAuth } from '../tools/auth/oauth2'
import { OTP } from '../core/auth_models'

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const identity = req.body?.identity || req.ip || 'unknown'
    return identity
  },
  message: { code: 429, message: 'Too many authentication attempts, please try again later.' },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many authentication attempts, please try again later.',
    })
  },
})

const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const email = req.body?.email || req.ip || 'unknown'
    return email
  },
  message: { code: 429, message: 'Too many OTP requests, please try again later.' },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 429,
      message: 'Too many OTP requests, please try again later.',
    })
  },
})

export function registerAuthRoutes(app: BaseApp, router: Router): void {
  const authRouter = Router({ mergeParams: true })

  authRouter.post('/auth-with-password', authRateLimiter, async (req: Request, res: Response) => {
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
        app.getJwtSecret(),
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
      const { provider, code, codeVerifier, redirectURL, createData, state } = req.body
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

      const db = app.db().getDataDB()

      if (state) {
        const stateRow = db.prepare(
          `SELECT * FROM _oauth2States WHERE state = ? AND collectionId = ? AND expiresAt > ?`
        ).get(state, collection.id, new Date().toISOString()) as any
        if (!stateRow) {
          return res.status(403).json({ code: 403, message: 'Invalid or expired OAuth2 state.' })
        }
        db.prepare(`DELETE FROM _oauth2States WHERE state = ?`).run(state)
      }

      const { user: oauthUser } = await handleOAuth2Callback(app, provider, code, codeVerifier, redirectURL)

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
        app.getJwtSecret(),
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
      if (!otpId || !password) {
        return res.status(400).json({ code: 400, message: 'Missing otpId or password.' })
      }

      const collection = await app.findCollectionByNameOrId(collectionIdOrName ?? 'users')
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      const db = app.db().getDataDB()
      const otpRow = db.prepare(`SELECT * FROM _otps WHERE id = ? AND collectionId = ?`).get(otpId, collection.id) as any
      if (!otpRow) {
        return res.status(400).json({ code: 400, message: 'Invalid or expired OTP.' })
      }

      const otp = new OTP(otpRow)
      if (otp.isExpired()) {
        db.prepare(`DELETE FROM _otps WHERE id = ?`).run(otpId)
        return res.status(400).json({ code: 400, message: 'OTP has expired.' })
      }

      if (otp.password !== password) {
        return res.status(400).json({ code: 400, message: 'Invalid OTP password.' })
      }

      // Find the associated record
      const recordRow = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(otp.recordRef) as any
      if (!recordRow) {
        return res.status(400).json({ code: 400, message: 'Associated record not found.' })
      }

      const record = new PBRecord(collection.id, collection.name, recordRow)
      const token = app.generateJWT(
        { id: record.id, type: 'auth', collectionId: collection.id },
        app.getJwtSecret(),
        '720h'
      )

      // Clean up used OTP
      db.prepare(`DELETE FROM _otps WHERE id = ?`).run(otpId)

      // Update lastLoginAt
      db.prepare(`UPDATE _r_${collection.id} SET lastLoginAt = ? WHERE id = ?`).run(new Date().toISOString(), record.id)

      res.json({ token, record: record.toJSON() })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/request-otp', otpRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email, collectionIdOrName } = req.body
      if (!email) {
        return res.status(400).json({ code: 400, message: 'Missing email.' })
      }

      const collection = await app.findCollectionByNameOrId(collectionIdOrName ?? 'users')
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _r_${collection.id} WHERE email = ?`).get(email) as any
      if (!row) {
        // Don't leak whether email exists
        return res.json({ otpId: '' })
      }

      const record = new PBRecord(collection.id, collection.name, row)

      // Generate OTP password (6-digit code)
      const otpPassword = Math.floor(100000 + Math.random() * 900000).toString()
      const otpId = generateRandomString(16)
      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      const requestIp = req.ip || req.socket.remoteAddress || 'unknown'

      // Delete any existing OTPs for this record
      db.prepare(`DELETE FROM _otps WHERE recordRef = ? AND collectionId = ?`).run(record.id, collection.id)

      // Store OTP with request IP
      db.prepare(
        `INSERT INTO _otps (id, recordRef, collectionId, password, sentTo, created, updated, createdAt, expiresAt, requestIp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(otpId, record.id, collection.id, otpPassword, email, now, now, now, expiresAt, requestIp)

      // Send OTP email if SMTP is configured
      const settings = app.settings()
      if (settings.smtp.host) {
        try {
          const { Mailer } = await import('../tools/mailer/mailer.js')
          const { EmailTemplateEngine, sendOTPEmail } = await import('../tools/mailer/templates.js')
          const mailer = Mailer.fromSettings(settings)
          const engine = new EmailTemplateEngine(settings)
          await sendOTPEmail(mailer, engine, email, { otp: otpPassword })
        } catch (emailErr: any) {
          app.logger().warn('Failed to send OTP email', emailErr.message)
        }
      }

      res.json({ otpId })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { token } = req.body
      if (!token) {
        return res.status(400).json({ code: 400, message: 'Token is required.' })
      }

      if (app.isTokenRevoked(token, 'refresh')) {
        return res.status(401).json({ code: 401, message: 'Token has been revoked.' })
      }

      const secret = app.getJwtSecret()
      const payload = app.parseJWT(token, secret)
      if (!payload || payload.type !== 'auth') {
        return res.status(401).json({ code: 401, message: 'Invalid token.' })
      }

      app.revokeToken(token, 'refresh', payload.id, 5)

      const newToken = app.generateJWT(
        { id: payload.id, type: 'auth', collectionId: payload.collectionId },
        app.getJwtSecret(),
        '720h'
      )

      res.json({ token: newToken })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  // MFA/TOTP endpoints
  authRouter.post('/mfa/setup', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ code: 401, message: 'Authentication required.' })
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      const payload = app.parseJWT(token, app.settings().appName || 'secret')
      if (!payload || payload.type !== 'auth') {
        return res.status(401).json({ code: 401, message: 'Invalid token.' })
      }

      const collection = await app.findCollectionByNameOrId(req.params.collectionIdOrName)
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      const db = app.db().getDataDB()
      const recordRow = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(payload.id) as any
      if (!recordRow) {
        return res.status(404).json({ code: 404, message: 'Record not found.' })
      }

      // Generate TOTP secret
      const secret = generateRandomString(32)
      const backupCodes = Array.from({ length: 8 }, () => Math.floor(10000000 + Math.random() * 90000000).toString())

      // Store MFA config
      const now = new Date().toISOString()
      const mfaId = generateRandomString(16)
      db.prepare(
        `INSERT INTO _mfas (id, recordRef, collectionId, method, created, updated, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(mfaId, payload.id, collection.id, 'totp', now, now, now, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString())

      res.json({
        secret,
        backupCodes,
        qrURL: `otpauth://totp/${collection.name}:${recordRow.email || payload.id}?secret=${secret}&issuer=${app.settings().appName || 'TspoonBase'}`,
      })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  authRouter.post('/mfa/verify', async (req: Request, res: Response) => {
    try {
      const { code } = req.body
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ code: 401, message: 'Authentication required.' })
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
      const payload = app.parseJWT(token, app.settings().appName || 'secret')
      if (!payload || payload.type !== 'auth') {
        return res.status(401).json({ code: 401, message: 'Invalid token.' })
      }

      const collection = await app.findCollectionByNameOrId(req.params.collectionIdOrName)
      if (!collection || !collection.isAuth()) {
        return res.status(400).json({ code: 400, message: 'Invalid collection.' })
      }

      const db = app.db().getDataDB()
      const mfaRow = db.prepare(`SELECT * FROM _mfas WHERE recordRef = ? AND collectionId = ? AND method = 'totp'`).get(payload.id, collection.id) as any
      if (!mfaRow) {
        return res.status(400).json({ code: 400, message: 'MFA not set up.' })
      }

      // Simple TOTP verification (time-based)
      const expectedCode = generateTOTPCode(mfaRow.id) // Using id as secret proxy
      if (code !== expectedCode) {
        return res.status(400).json({ code: 400, message: 'Invalid MFA code.' })
      }

      res.json({ verified: true })
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
        allowOTPAuth: true,
        oauth2Providers: oauth2Registry.list().map(p => ({
          name: p.name,
          displayName: p.displayName,
          authURL: p.getAuthURL(''),
          pkce: p.pkce,
        })),
      }))

      res.json({ authMethods, mfa: { enabled: true }, otp: { enabled: true } })
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

// Simple TOTP code generator (for demo - use speakeasy in production)
function generateTOTPCode(secret: string, period = 30, digits = 6): string {
  const now = Math.floor(Date.now() / 1000)
  const timeStep = Math.floor(now / period)
  // Simple hash-based TOTP for demonstration
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha1', secret)
  hmac.update(Buffer.from(timeStep.toString().padStart(16, '0'), 'hex'))
  const hash = hmac.digest()
  const offset = hash[hash.length - 1] & 0x0f
  const code = ((hash[offset] & 0x7f) << 24 |
    (hash[offset + 1] & 0xff) << 16 |
    (hash[offset + 2] & 0xff) << 8 |
    (hash[offset + 3] & 0xff)) % Math.pow(10, digits)
  return code.toString().padStart(digits, '0')
}
