import { BaseModel } from './model'

export interface MFAData {
  id?: string
  created?: string
  updated?: string
  recordRef: string
  collectionId: string
  method: string
  createdAt: string
  expiresAt: string
}

export class MFA extends BaseModel {
  recordRef: string
  collectionId: string
  method: string
  createdAt: Date
  expiresAt: Date

  constructor(data: MFAData) {
    super(data)
    this.recordRef = data.recordRef
    this.collectionId = data.collectionId
    this.method = data.method ?? 'totp'
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 60 * 1000)
  }

  tableName(): string {
    return '_mfas'
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      recordRef: this.recordRef,
      collectionId: this.collectionId,
      method: this.method,
      createdAt: this.createdAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
    }
  }
}

export interface OTPData {
  id?: string
  created?: string
  updated?: string
  recordRef: string
  collectionId: string
  password: string
  sentTo: string
  createdAt: string
  expiresAt: string
}

export class OTP extends BaseModel {
  recordRef: string
  collectionId: string
  password: string
  sentTo: string
  createdAt: Date
  expiresAt: Date

  constructor(data: OTPData) {
    super(data)
    this.recordRef = data.recordRef
    this.collectionId = data.collectionId
    this.password = data.password
    this.sentTo = data.sentTo
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 15 * 60 * 1000)
  }

  tableName(): string {
    return '_otps'
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      recordRef: this.recordRef,
      collectionId: this.collectionId,
      sentTo: this.sentTo,
      createdAt: this.createdAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
    }
  }
}

export interface AuthOriginData {
  id?: string
  created?: string
  updated?: string
  recordRef: string
  collectionId: string
  fingerprint: string
  authMethod: string
  createdAt: string
  expiresAt: string
  lastSeenAt: string
}

export class AuthOrigin extends BaseModel {
  recordRef: string
  collectionId: string
  fingerprint: string
  authMethod: string
  createdAt: Date
  expiresAt: Date
  lastSeenAt: Date

  constructor(data: AuthOriginData) {
    super(data)
    this.recordRef = data.recordRef
    this.collectionId = data.collectionId
    this.fingerprint = data.fingerprint
    this.authMethod = data.authMethod ?? 'password'
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date()
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    this.lastSeenAt = data.lastSeenAt ? new Date(data.lastSeenAt) : new Date()
  }

  tableName(): string {
    return '_authOrigins'
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      recordRef: this.recordRef,
      collectionId: this.collectionId,
      fingerprint: this.fingerprint,
      authMethod: this.authMethod,
      createdAt: this.createdAt.toISOString(),
      expiresAt: this.expiresAt.toISOString(),
      lastSeenAt: this.lastSeenAt.toISOString(),
    }
  }
}

export interface ExternalAuthData {
  id?: string
  created?: string
  updated?: string
  recordRef: string
  collectionId: string
  provider: string
  providerId: string
}

export class ExternalAuth extends BaseModel {
  recordRef: string
  collectionId: string
  provider: string
  providerId: string

  constructor(data: ExternalAuthData) {
    super(data)
    this.recordRef = data.recordRef
    this.collectionId = data.collectionId
    this.provider = data.provider
    this.providerId = data.providerId
  }

  tableName(): string {
    return '_externalAuths'
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      recordRef: this.recordRef,
      collectionId: this.collectionId,
      provider: this.provider,
      providerId: this.providerId,
    }
  }
}
