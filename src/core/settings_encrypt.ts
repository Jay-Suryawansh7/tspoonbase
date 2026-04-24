import { BaseApp } from '../core/base'
import { encrypt, decrypt } from '../tools/security/crypto'

const ENCRYPTED_KEYS = ['smtp.password', 's3.secret', 'appURL']

export function encryptSettings(settings: Record<string, any>, secret: string): Record<string, any> {
  const encrypted = { ...settings }

  for (const key of ENCRYPTED_KEYS) {
    const value = getNestedValue(settings, key)
    if (value && typeof value === 'string' && !isEncrypted(value)) {
      setNestedValue(encrypted, key, `enc:${encrypt(value, secret)}`)
    }
  }

  return encrypted
}

export function decryptSettings(settings: Record<string, any>, secret: string): Record<string, any> {
  const decrypted = { ...settings }

  for (const key of ENCRYPTED_KEYS) {
    const value = getNestedValue(settings, key)
    if (value && typeof value === 'string' && isEncrypted(value)) {
      try {
        const encryptedValue = value.slice(4) // Remove 'enc:' prefix
        setNestedValue(decrypted, key, decrypt(encryptedValue, secret))
      } catch {
        // If decryption fails, keep original value
      }
    }
  }

  return decrypted
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith('enc:')
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return current
}

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {}
    }
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

export class SettingsEncryption {
  private app: BaseApp

  constructor(app: BaseApp) {
    this.app = app
  }

  private getSecret(): string {
    return this.app.encryptionEnv || this.app.settings().appName || 'tspoonbase-secret'
  }

  encrypt(value: string): string {
    return `enc:${encrypt(value, this.getSecret())}`
  }

  decrypt(value: string): string {
    if (!isEncrypted(value)) return value
    return decrypt(value.slice(4), this.getSecret())
  }

  encryptSettings(settings: Record<string, any>): Record<string, any> {
    return encryptSettings(settings, this.getSecret())
  }

  decryptSettings(settings: Record<string, any>): Record<string, any> {
    return decryptSettings(settings, this.getSecret())
  }
}
