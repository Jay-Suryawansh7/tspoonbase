export interface FieldData {
  id: string
  name: string
  type: string
  system: boolean
  required: boolean
  presentable: boolean
  hidden: boolean
}

export abstract class Field {
  id: string
  name: string
  type: string
  system: boolean
  required: boolean
  presentable: boolean
  hidden: boolean

  constructor(data?: Partial<FieldData>) {
    this.id = data?.id ?? generateFieldId()
    this.name = data?.name ?? ''
    this.type = data?.type ?? 'text'
    this.system = data?.system ?? false
    this.required = data?.required ?? false
    this.presentable = data?.presentable ?? false
    this.hidden = data?.hidden ?? false
  }

  abstract validate(value: any): Error | null

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      system: this.system,
      required: this.required,
      presentable: this.presentable,
      hidden: this.hidden,
    }
  }
}

function generateFieldId(): string {
  return `fld_${Math.random().toString(36).slice(2, 10)}`
}

export class TextField extends Field {
  type = 'text'
  max: number
  min: number
  pattern: string

  constructor(data?: Partial<FieldData & { max?: number; min?: number; pattern?: string }>) {
    super(data)
    this.max = data?.max ?? 0
    this.min = data?.min ?? 0
    this.pattern = data?.pattern ?? ''
  }

  validate(value: any): Error | null {
    if (this.required && (!value || typeof value !== 'string')) {
      return new Error('Required field')
    }
    if (value && typeof value === 'string') {
      if (this.min > 0 && value.length < this.min) {
        return new Error(`Minimum length is ${this.min}`)
      }
      if (this.max > 0 && value.length > this.max) {
        return new Error(`Maximum length is ${this.max}`)
      }
      if (this.pattern && !new RegExp(this.pattern).test(value)) {
        return new Error('Does not match pattern')
      }
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), max: this.max, min: this.min, pattern: this.pattern }
  }
}

export class NumberField extends Field {
  type = 'number'
  max: number
  min: number
  onlyInt: boolean

  constructor(data?: Partial<FieldData & { max?: number; min?: number; onlyInt?: boolean }>) {
    super(data)
    this.max = data?.max ?? 0
    this.min = data?.min ?? 0
    this.onlyInt = data?.onlyInt ?? false
  }

  validate(value: any): Error | null {
    if (this.required && (value === null || value === undefined || value === '')) {
      return new Error('Required field')
    }
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value)
      if (isNaN(num)) return new Error('Must be a number')
      if (this.onlyInt && !Number.isInteger(num)) return new Error('Must be an integer')
      if (this.min !== 0 && num < this.min) return new Error(`Minimum value is ${this.min}`)
      if (this.max !== 0 && num > this.max) return new Error(`Maximum value is ${this.max}`)
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), max: this.max, min: this.min, onlyInt: this.onlyInt }
  }
}

export class EmailField extends Field {
  type = 'email'
  exceptDomains: string[]
  onlyDomains: string[]

  constructor(data?: Partial<FieldData & { exceptDomains?: string[]; onlyDomains?: string[] }>) {
    super(data)
    this.exceptDomains = data?.exceptDomains ?? []
    this.onlyDomains = data?.onlyDomains ?? []
  }

  validate(value: any): Error | null {
    if (this.required && (!value || typeof value !== 'string')) {
      return new Error('Required field')
    }
    if (value && typeof value === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return new Error('Invalid email format')
      }
      const domain = value.split('@')[1]
      if (this.exceptDomains.includes(domain)) {
        return new Error(`Domain ${domain} is not allowed`)
      }
      if (this.onlyDomains.length > 0 && !this.onlyDomains.includes(domain)) {
        return new Error(`Domain ${domain} is not in allowed list`)
      }
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), exceptDomains: this.exceptDomains, onlyDomains: this.onlyDomains }
  }
}

export class URLField extends Field {
  type = 'url'
  exceptDomains: string[]
  onlyDomains: string[]

  constructor(data?: Partial<FieldData & { exceptDomains?: string[]; onlyDomains?: string[] }>) {
    super(data)
    this.exceptDomains = data?.exceptDomains ?? []
    this.onlyDomains = data?.onlyDomains ?? []
  }

  validate(value: any): Error | null {
    if (this.required && (!value || typeof value !== 'string')) {
      return new Error('Required field')
    }
    if (value && typeof value === 'string') {
      try {
        new URL(value)
      } catch {
        return new Error('Invalid URL format')
      }
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), exceptDomains: this.exceptDomains, onlyDomains: this.onlyDomains }
  }
}

export class BoolField extends Field {
  type = 'bool'

  validate(value: any): Error | null {
    if (this.required && (value === null || value === undefined)) {
      return new Error('Required field')
    }
    return null
  }
}

export class DateField extends Field {
  type = 'date'
  max: string
  min: string

  constructor(data?: Partial<FieldData & { max?: string; min?: string }>) {
    super(data)
    this.max = data?.max ?? ''
    this.min = data?.min ?? ''
  }

  validate(value: any): Error | null {
    if (this.required && (!value || typeof value !== 'string')) {
      return new Error('Required field')
    }
    if (value && typeof value === 'string') {
      const d = new Date(value)
      if (isNaN(d.getTime())) return new Error('Invalid date')
      if (this.min && d < new Date(this.min)) return new Error(`Date must be after ${this.min}`)
      if (this.max && d > new Date(this.max)) return new Error(`Date must be before ${this.max}`)
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), max: this.max, min: this.min }
  }
}

export class SelectField extends Field {
  type = 'select'
  maxSelect: number
  values: string[]

  constructor(data?: Partial<FieldData & { maxSelect?: number; values?: string[] }>) {
    super(data)
    this.maxSelect = data?.maxSelect ?? 1
    this.values = data?.values ?? []
  }

  validate(value: any): Error | null {
    if (this.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return new Error('Required field')
    }
    if (value) {
      const values = Array.isArray(value) ? value : [value]
      if (this.maxSelect > 0 && values.length > this.maxSelect) {
        return new Error(`Maximum ${this.maxSelect} selections allowed`)
      }
      for (const v of values) {
        if (!this.values.includes(v)) {
          return new Error(`Value "${v}" is not in the allowed list`)
        }
      }
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), maxSelect: this.maxSelect, values: this.values }
  }
}

export class FileField extends Field {
  type = 'file'
  maxSelect: number
  maxSize: number
  mimeTypes: string[]
  protectedDirs: string[]
  thumbs: string[]

  constructor(data?: Partial<FieldData & { maxSelect?: number; maxSize?: number; mimeTypes?: string[]; protectedDirs?: string[]; thumbs?: string[] }>) {
    super(data)
    this.maxSelect = data?.maxSelect ?? 1
    this.maxSize = data?.maxSize ?? 5242880
    this.mimeTypes = data?.mimeTypes ?? []
    this.protectedDirs = data?.protectedDirs ?? []
    this.thumbs = data?.thumbs ?? []
  }

  validate(value: any): Error | null {
    if (this.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return new Error('Required field')
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), maxSelect: this.maxSelect, maxSize: this.maxSize, mimeTypes: this.mimeTypes, protectedDirs: this.protectedDirs, thumbs: this.thumbs }
  }
}

export class RelationField extends Field {
  type = 'relation'
  collectionId: string
  collectionName: string
  cascadeDelete: boolean
  minSelect: number
  maxSelect: number
  displayFields: string[]

  constructor(data?: Partial<FieldData & { collectionId?: string; collectionName?: string; cascadeDelete?: boolean; minSelect?: number; maxSelect?: number; displayFields?: string[] }>) {
    super(data)
    this.collectionId = data?.collectionId ?? ''
    this.collectionName = data?.collectionName ?? ''
    this.cascadeDelete = data?.cascadeDelete ?? false
    this.minSelect = data?.minSelect ?? 0
    this.maxSelect = data?.maxSelect ?? 0
    this.displayFields = data?.displayFields ?? []
  }

  validate(value: any): Error | null {
    if (this.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return new Error('Required field')
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), collectionId: this.collectionId, collectionName: this.collectionName, cascadeDelete: this.cascadeDelete, minSelect: this.minSelect, maxSelect: this.maxSelect, displayFields: this.displayFields }
  }
}

export class JSONField extends Field {
  type = 'json'
  maxSize: number

  constructor(data?: Partial<FieldData & { maxSize?: number }>) {
    super(data)
    this.maxSize = data?.maxSize ?? 2000000
  }

  validate(value: any): Error | null {
    if (this.required && (value === null || value === undefined)) {
      return new Error('Required field')
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), maxSize: this.maxSize }
  }
}

export class EditorField extends Field {
  type = 'editor'
  convertURLs: boolean

  constructor(data?: Partial<FieldData & { convertURLs?: boolean }>) {
    super(data)
    this.convertURLs = data?.convertURLs ?? false
  }

  validate(value: any): Error | null {
    if (this.required && (!value || typeof value !== 'string')) {
      return new Error('Required field')
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), convertURLs: this.convertURLs }
  }
}

export class AutoDateField extends Field {
  type = 'autodate'
  onInit: string
  onUpdate: string

  constructor(data?: Partial<FieldData & { onInit?: string; onUpdate?: string }>) {
    super(data)
    this.onInit = data?.onInit ?? ''
    this.onUpdate = data?.onUpdate ?? ''
  }

  validate(): Error | null {
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), onInit: this.onInit, onUpdate: this.onUpdate }
  }
}

export class GeoPointField extends Field {
  type = 'geoPoint'

  validate(value: any): Error | null {
    if (this.required && (!value || typeof value !== 'object')) {
      return new Error('Required field')
    }
    if (value && typeof value === 'object') {
      if (typeof value.lat !== 'number' || typeof value.lng !== 'number') {
        return new Error('Must have lat and lng properties')
      }
    }
    return null
  }
}

export class VectorField extends Field {
  type = 'vector'
  dimensions: number

  constructor(data?: Partial<FieldData & { dimensions?: number }>) {
    super(data)
    this.dimensions = data?.dimensions ?? 1536
  }

  validate(value: any): Error | null {
    if (this.required && (value === null || value === undefined)) {
      return new Error('Required field')
    }
    if (value !== null && value !== undefined) {
      let arr: any[] | null = null
      if (Array.isArray(value)) {
        arr = value
      } else if (typeof value === 'string') {
        try { arr = JSON.parse(value) } catch { /* ignore */ }
      }
      if (!Array.isArray(arr)) {
        return new Error('Must be an array of numbers')
      }
      if (arr.length !== this.dimensions) {
        return new Error(`Expected ${this.dimensions} dimensions, got ${arr.length}`)
      }
      for (const v of arr) {
        if (typeof v !== 'number' || isNaN(v)) {
          return new Error('All elements must be numbers')
        }
      }
    }
    return null
  }

  toJSON(): Record<string, any> {
    return { ...super.toJSON(), dimensions: this.dimensions }
  }
}

export function fieldFromJSON(data: Record<string, any>): Field {
  switch (data.type) {
    case 'text': return new TextField(data)
    case 'number': return new NumberField(data)
    case 'email': return new EmailField(data)
    case 'url': return new URLField(data)
    case 'bool': return new BoolField(data)
    case 'date': return new DateField(data)
    case 'select': return new SelectField(data)
    case 'file': return new FileField(data)
    case 'relation': return new RelationField(data)
    case 'json': return new JSONField(data)
    case 'editor': return new EditorField(data)
    case 'autodate': return new AutoDateField(data)
    case 'geoPoint': return new GeoPointField(data)
    case 'vector': return new VectorField(data)
    default: return new TextField(data)
  }
}
