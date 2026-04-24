import { describe, it, expect } from 'vitest'
import { encryptSettings, decryptSettings, isEncrypted } from '../src/core/settings_encrypt'

describe('Settings Encryption', () => {
  const secret = 'test-secret-key'

  it('should encrypt sensitive settings', () => {
    const settings = {
      appName: 'TestApp',
      smtp: {
        host: 'smtp.example.com',
        password: 'my-secret-password',
      },
      s3: {
        secret: 'aws-secret-key',
      },
    }

    const encrypted = encryptSettings(settings, secret)
    expect(isEncrypted(encrypted.smtp.password)).toBe(true)
    expect(isEncrypted(encrypted.s3.secret)).toBe(true)
    expect(encrypted.appName).toBe('TestApp')
  })

  it('should decrypt encrypted settings', () => {
    const settings = {
      smtp: {
        password: 'my-secret-password',
      },
    }

    const encrypted = encryptSettings(settings, secret)
    const decrypted = decryptSettings(encrypted, secret)
    expect(decrypted.smtp.password).toBe('my-secret-password')
  })

  it('should not double encrypt', () => {
    const settings = {
      smtp: {
        password: 'my-secret-password',
      },
    }

    const encrypted1 = encryptSettings(settings, secret)
    const encrypted2 = encryptSettings(encrypted1, secret)
    expect(encrypted2.smtp.password).toBe(encrypted1.smtp.password)
  })

  it('should handle decryption of non-encrypted values', () => {
    const settings = {
      smtp: {
        password: 'plaintext',
      },
    }

    const decrypted = decryptSettings(settings, secret)
    expect(decrypted.smtp.password).toBe('plaintext')
  })
})
