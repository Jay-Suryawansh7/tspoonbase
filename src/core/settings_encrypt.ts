import { BaseApp } from '../core/base'
import { encrypt, decrypt } from '../tools/security/crypto'

const ENCRYPTED_KEYS = ['smtp.password', 's3.secret', 'appURL']

// FIXED[H-2]: Made async to support async scrypt in crypto.ts
export async function encryptSettings(settings: Record<string, any>, secret: string): Promise<Record<string, any>> {
  const encrypted = { ...settings }

  for (const key of ENCRYPTED_KEYS) {
    const value = getNestedValue(settings, key)
    if (value && typeof value === 'string' && !isEncrypted(value)) {
      setNestedValue(encrypted, key, `enc:${await encrypt(value, secret)}`)
    }
  }

  return encrypted
}

export async function decryptSettings(settings: Record<string, any>, secret: string): Promise<Record<string, any>> {
  const decrypted = { ...settings }

  for (const key of ENCRYPTED_KEYS) {
    const value = getNestedValue(settings, key)
    if (value && typeof value === 'string' && isEncrypted(value)) {
      try {
        const encryptedValue = value.slice(4) // Remove 'enc:' prefix
        setNestedValue(decrypted, key, await decrypt(encryptedValue, secret))
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
    if (!this.app.encryptionEnv || this.app.encryptionEnv.length < 16) {
      throw new Error(
        'SETTINGS_ENCRYPTION_KEY is required (min 16 characters). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      )
    }
    return this.app.encryptionEnv
  }

  // FIXED[H-2]: Made async to support async scrypt
  async encrypt(value: string): Promise<string> {
    return `enc:${await encrypt(value, this.getSecret())}`
  }

  async decrypt(value: string): Promise<string> {
    if (!isEncrypted(value)) return value
    return await decrypt(value.slice(4), this.getSecret())
  }

  async encryptSettings(settings: Record<string, any>): Promise<Record<string, any>> {
    return encryptSettings(settings, this.getSecret())
  }

  async decryptSettings(settings: Record<string, any>): Promise<Record<string, any>> {
    return decryptSettings(settings, this.getSecret())
  }
}
