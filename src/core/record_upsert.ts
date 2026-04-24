import { BaseApp } from './base'
import { RecordModel as PBRecord, RecordData } from './record'
import { Collection } from './collection'
import { Field, TextField, NumberField, EmailField, URLField, BoolField, DateField, SelectField, FileField, RelationField, JSONField, EditorField, GeoPointField, VectorField } from './field'

export interface ValidationError {
  field: string
  message: string
}

export interface RecordUpsertOptions {
  data: Record<string, any>
  collection: Collection
  record?: PBRecord | null
  requestInfo?: any
}

export class RecordUpsertForm {
  private app: BaseApp
  private collection: Collection
  private record: PBRecord | null
  private data: Record<string, any>
  private errors: ValidationError[] = []

  constructor(app: BaseApp, options: RecordUpsertOptions) {
    this.app = app
    this.collection = options.collection
    this.record = options.record ?? null
    this.data = options.data
  }

  validate(): ValidationError[] {
    this.errors = []

    for (const field of this.collection.fields) {
      const value = this.data[field.name]

      // Skip system fields
      if (field.system && !['email', 'username'].includes(field.name)) continue

      // Check required
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          this.errors.push({ field: field.name, message: `Field "${field.name}" is required.` })
          continue
        }
      }

      // Field-specific validation
      const error = field.validate(value)
      if (error) {
        this.errors.push({ field: field.name, message: error.message })
      }

      // Additional validation for auth collections
      if (this.collection.isAuth()) {
        this.validateAuthField(field, value)
      }
    }

    // Validate password fields for auth collections
    if (this.collection.isAuth()) {
      this.validatePasswordFields()
    }

    return this.errors
  }

  isValid(): boolean {
    this.validate()
    return this.errors.length === 0
  }

  getErrors(): ValidationError[] {
    return this.errors
  }

  private validateAuthField(field: Field, value: any): void {
    if (field.name === 'email' && value) {
      const emailStr = String(value)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        this.errors.push({ field: 'email', message: 'Invalid email format.' })
      }

      // Check allowed domains
      if (this.collection.authOptions?.onlyEmailDomains?.length) {
        const domain = emailStr.split('@')[1]
        if (!this.collection.authOptions.onlyEmailDomains.includes(domain)) {
          this.errors.push({ field: 'email', message: `Email domain not allowed.` })
        }
      }

      // Check excluded domains
      if (this.collection.authOptions?.exceptEmailDomains?.length) {
        const domain = emailStr.split('@')[1]
        if (this.collection.authOptions.exceptEmailDomains.includes(domain)) {
          this.errors.push({ field: 'email', message: `Email domain not allowed.` })
        }
      }
    }
  }

  private validatePasswordFields(): void {
    const password = this.data.password
    const passwordConfirm = this.data.passwordConfirm
    const oldPassword = this.data.oldPassword
    const newPassword = this.data.newPassword
    const newPasswordConfirm = this.data.newPasswordConfirm

    const minLength = this.collection.authOptions?.minPasswordLength ?? 8

    if (password !== undefined) {
      if (password.length < minLength) {
        this.errors.push({ field: 'password', message: `Password must be at least ${minLength} characters.` })
      }
      if (passwordConfirm !== undefined && password !== passwordConfirm) {
        this.errors.push({ field: 'passwordConfirm', message: 'Passwords do not match.' })
      }
    }

    if (newPassword !== undefined) {
      if (newPassword.length < minLength) {
        this.errors.push({ field: 'newPassword', message: `Password must be at least ${minLength} characters.` })
      }
      if (newPasswordConfirm !== undefined && newPassword !== newPasswordConfirm) {
        this.errors.push({ field: 'newPasswordConfirm', message: 'Passwords do not match.' })
      }
      if (oldPassword === undefined && this.record) {
        this.errors.push({ field: 'oldPassword', message: 'Current password is required.' })
      }
    }
  }

  buildRecord(): PBRecord {
    const recordData: RecordData = {
      id: this.record?.id,
      collectionId: this.collection.id,
      collectionName: this.collection.name,
    }

    // Copy existing data if updating
    if (this.record) {
      for (const key of this.record.keys()) {
        recordData[key] = this.record.get(key)
      }
    }

    // Apply new data
    for (const [key, value] of Object.entries(this.data)) {
      if (!['password', 'passwordConfirm', 'oldPassword', 'newPassword', 'newPasswordConfirm'].includes(key)) {
        recordData[key] = value
      }
    }

    // Handle autodate fields
    for (const field of this.collection.fields) {
      if (field.type === 'autodate') {
        const autoDateField = field as any
        if (autoDateField.onInit && !this.record) {
          recordData[field.name] = new Date().toISOString()
        }
        if (autoDateField.onUpdate) {
          recordData[field.name] = new Date().toISOString()
        }
      }
    }

    const record = new PBRecord(this.collection.id, this.collection.name, recordData)

    // Set password hash if provided
    if (this.data.password) {
      // Hash will be set by the caller using app.hashPassword
      record.set('passwordHash', this.data.password)
    }
    if (this.data.newPassword) {
      record.set('passwordHash', this.data.newPassword)
    }

    // Set auth defaults for new records
    if (!this.record && this.collection.isAuth()) {
      record.set('emailVisibility', this.data.emailVisibility ?? true)
      record.set('verified', this.data.verified ?? false)
    }

    return record
  }
}

export async function validateAndCreateRecord(
  app: BaseApp,
  collection: Collection,
  data: Record<string, any>
): Promise<{ record: PBRecord; errors: ValidationError[] }> {
  const form = new RecordUpsertForm(app, { data, collection })
  const errors = form.validate()

  if (errors.length > 0) {
    return { record: null as any, errors }
  }

  const record = form.buildRecord()

  // Hash password if present
  if (data.password) {
    record.set('passwordHash', await app.hashPassword(data.password))
  }

  return { record, errors: [] }
}

export async function validateAndUpdateRecord(
  app: BaseApp,
  collection: Collection,
  existingRecord: PBRecord,
  data: Record<string, any>
): Promise<{ record: PBRecord; errors: ValidationError[] }> {
  const form = new RecordUpsertForm(app, { data, collection, record: existingRecord })
  const errors = form.validate()

  if (errors.length > 0) {
    return { record: null as any, errors }
  }

  const record = form.buildRecord()

  // Hash password if present
  if (data.newPassword) {
    record.set('passwordHash', await app.hashPassword(data.newPassword))
  } else if (data.password) {
    record.set('passwordHash', await app.hashPassword(data.password))
  }

  return { record, errors: [] }
}
