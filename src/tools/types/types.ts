export class DateTime {
  private date: Date

  constructor(date?: Date | string | number) {
    this.date = date ? new Date(date) : new Date()
  }

  static now(): DateTime {
    return new DateTime()
  }

  static parse(value: string | DateTime | null): DateTime | null {
    if (!value) return null
    if (value instanceof DateTime) return value
    const d = new Date(value)
    if (isNaN(d.getTime())) return null
    return new DateTime(d)
  }

  static parseExact(value: string): DateTime | null {
    if (!value) return null
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/)
    if (!match) return DateTime.parse(value)
    const [, year, month, day, hour, min, sec, ms] = match
    return new DateTime(`${year}-${month}-${day}T${hour}:${min}:${sec}.${ms || '0'}Z`)
  }

  toString(): string {
    return this.date.toISOString().replace('T', ' ').replace('Z', '')
  }

  toUTCString(): string {
    return this.date.toISOString().replace('T', ' ').replace('Z', '')
  }

  getTime(): number {
    return this.date.getTime()
  }

  toDate(): Date {
    return this.date
  }
}

export class GeoPoint {
  lat: number
  lng: number

  constructor(lat: number, lng: number) {
    this.lat = lat
    this.lng = lng
  }

  static parse(value: string | GeoPoint | null): GeoPoint | null {
    if (!value) return null
    if (value instanceof GeoPoint) return value
    if (typeof value === 'string') {
      const parts = value.split(',').map(Number)
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return new GeoPoint(parts[0], parts[1])
      }
    }
    return null
  }

  toString(): string {
    return `${this.lat},${this.lng}`
  }

  toJSON(): { lat: number; lng: number } {
    return { lat: this.lat, lng: this.lng }
  }
}

export class JSONArray<T = any> extends Array<T> {
  static parse(value: string | any[] | null): any[] | null {
    if (!value) return null
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    return null
  }

  toString(): string {
    return JSON.stringify(this)
  }
}

export class JSONMap<T = Record<string, any>> {
  private data: Map<string, any>

  constructor(data?: Record<string, any>) {
    this.data = new Map(Object.entries(data ?? {}))
  }

  static parse(value: string | Record<string, any> | JSONMap | null): JSONMap | null {
    if (!value) return null
    if (value instanceof JSONMap) return value
    if (typeof value === 'string') {
      try {
        return new JSONMap(JSON.parse(value))
      } catch {
        return null
      }
    }
    if (typeof value === 'object') return new JSONMap(value)
    return null
  }

  get(key: string): any {
    return this.data.get(key)
  }

  set(key: string, value: any): void {
    this.data.set(key, value)
  }

  delete(key: string): boolean {
    return this.data.delete(key)
  }

  has(key: string): boolean {
    return this.data.has(key)
  }

  keys(): string[] {
    return Array.from(this.data.keys())
  }

  values(): any[] {
    return Array.from(this.data.values())
  }

  entries(): [string, any][] {
    return Array.from(this.data.entries())
  }

  toJSON(): Record<string, any> {
    return Object.fromEntries(this.data)
  }

  toString(): string {
    return JSON.stringify(this.toJSON())
  }
}

export class JSONRaw {
  value: any

  constructor(value: any) {
    this.value = value
  }

  static parse(value: string | any | null): JSONRaw | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') {
      try {
        return new JSONRaw(JSON.parse(value))
      } catch {
        return new JSONRaw(value)
      }
    }
    return new JSONRaw(value)
  }

  toString(): string {
    return JSON.stringify(this.value)
  }
}
