import { BaseApp } from './base'
import { RecordModel as PBRecord } from './record'
import { MFA, OTP, AuthOrigin, ExternalAuth } from './auth_models'

export async function findAllMFAsByRecord(app: BaseApp, record: PBRecord): Promise<MFA[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _mfas WHERE recordRef = ? AND collectionId = ? ORDER BY created DESC`
  ).all(record.id, record.collectionId) as any[]

  return rows.map(row => new MFA(row))
}

export async function findAllMFAsByCollection(app: BaseApp, collectionId: string): Promise<MFA[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _mfas WHERE collectionId = ? ORDER BY created DESC`
  ).all(collectionId) as any[]

  return rows.map(row => new MFA(row))
}

export async function findMFAById(app: BaseApp, id: string): Promise<MFA | null> {
  const db = app.db().getDataDB()
  const row = db.prepare(`SELECT * FROM _mfas WHERE id = ?`).get(id) as any
  if (!row) return null
  return new MFA(row)
}

export async function deleteAllMFAsByRecord(app: BaseApp, record: PBRecord): Promise<void> {
  const db = app.db().getDataDB()
  db.prepare(`DELETE FROM _mfas WHERE recordRef = ? AND collectionId = ?`).run(record.id, record.collectionId)
}

export async function deleteExpiredMFAs(app: BaseApp): Promise<number> {
  const db = app.db().getDataDB()
  const now = new Date().toISOString()
  const result = db.prepare(`DELETE FROM _mfas WHERE expiresAt < ?`).run(now)
  return result.changes
}

export async function findAllOTPsByRecord(app: BaseApp, record: PBRecord): Promise<OTP[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _otps WHERE recordRef = ? AND collectionId = ? ORDER BY created DESC`
  ).all(record.id, record.collectionId) as any[]

  return rows.map(row => new OTP(row))
}

export async function findAllOTPsByCollection(app: BaseApp, collectionId: string): Promise<OTP[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _otps WHERE collectionId = ? ORDER BY created DESC`
  ).all(collectionId) as any[]

  return rows.map(row => new OTP(row))
}

export async function findOTPById(app: BaseApp, id: string): Promise<OTP | null> {
  const db = app.db().getDataDB()
  const row = db.prepare(`SELECT * FROM _otps WHERE id = ?`).get(id) as any
  if (!row) return null
  return new OTP(row)
}

export async function deleteAllOTPsByRecord(app: BaseApp, record: PBRecord): Promise<void> {
  const db = app.db().getDataDB()
  db.prepare(`DELETE FROM _otps WHERE recordRef = ? AND collectionId = ?`).run(record.id, record.collectionId)
}

export async function deleteExpiredOTPs(app: BaseApp): Promise<number> {
  const db = app.db().getDataDB()
  const now = new Date().toISOString()
  const result = db.prepare(`DELETE FROM _otps WHERE expiresAt < ?`).run(now)
  return result.changes
}

export async function findAllAuthOriginsByRecord(app: BaseApp, record: PBRecord): Promise<AuthOrigin[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _authOrigins WHERE recordRef = ? AND collectionId = ? ORDER BY created DESC`
  ).all(record.id, record.collectionId) as any[]

  return rows.map(row => new AuthOrigin(row))
}

export async function findAllAuthOriginsByCollection(app: BaseApp, collectionId: string): Promise<AuthOrigin[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _authOrigins WHERE collectionId = ? ORDER BY created DESC`
  ).all(collectionId) as any[]

  return rows.map(row => new AuthOrigin(row))
}

export async function findAuthOriginById(app: BaseApp, id: string): Promise<AuthOrigin | null> {
  const db = app.db().getDataDB()
  const row = db.prepare(`SELECT * FROM _authOrigins WHERE id = ?`).get(id) as any
  if (!row) return null
  return new AuthOrigin(row)
}

export async function findAuthOriginByRecordAndFingerprint(
  app: BaseApp,
  record: PBRecord,
  fingerprint: string
): Promise<AuthOrigin | null> {
  const db = app.db().getDataDB()
  const row = db.prepare(
    `SELECT * FROM _authOrigins WHERE recordRef = ? AND collectionId = ? AND fingerprint = ?`
  ).get(record.id, record.collectionId, fingerprint) as any
  if (!row) return null
  return new AuthOrigin(row)
}

export async function deleteAllAuthOriginsByRecord(app: BaseApp, record: PBRecord): Promise<void> {
  const db = app.db().getDataDB()
  db.prepare(`DELETE FROM _authOrigins WHERE recordRef = ? AND collectionId = ?`).run(record.id, record.collectionId)
}

export async function findAllExternalAuthsByRecord(app: BaseApp, record: PBRecord): Promise<ExternalAuth[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _externalAuths WHERE recordRef = ? AND collectionId = ?`
  ).all(record.id, record.collectionId) as any[]

  return rows.map(row => new ExternalAuth(row))
}

export async function findAllExternalAuthsByCollection(app: BaseApp, collectionId: string): Promise<ExternalAuth[]> {
  const db = app.db().getDataDB()
  const rows = db.prepare(
    `SELECT * FROM _externalAuths WHERE collectionId = ?`
  ).all(collectionId) as any[]

  return rows.map(row => new ExternalAuth(row))
}

export async function findFirstExternalAuthByExpr(
  app: BaseApp,
  expression: { field: string; value: any }
): Promise<ExternalAuth | null> {
  const db = app.db().getDataDB()
  const row = db.prepare(
    `SELECT * FROM _externalAuths WHERE ${expression.field} = ? ORDER BY created DESC LIMIT 1`
  ).get(expression.value) as any
  if (!row) return null
  return new ExternalAuth(row)
}
