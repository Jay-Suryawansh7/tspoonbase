export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, any>
  timestamp: Date
}

export class Logger {
  private isDev: boolean
  private entries: LogEntry[] = []
  private maxEntries: number

  constructor(isDev: boolean, maxEntries = 10000) {
    this.isDev = isDev
    this.maxEntries = maxEntries
  }

  debug(message: string, data?: Record<string, any>): void {
    if (!this.isDev) return
    const entry: LogEntry = { level: 'debug', message, data, timestamp: new Date() }
    this.entries.push(entry)
    console.log(`[DEBUG] ${message}`, data ?? '')
  }

  info(message: string, data?: Record<string, any>): void {
    const entry: LogEntry = { level: 'info', message, data, timestamp: new Date() }
    this.entries.push(entry)
    console.log(`[INFO] ${message}`, data ?? '')
  }

  warn(message: string, data?: Record<string, any>): void {
    const entry: LogEntry = { level: 'warn', message, data, timestamp: new Date() }
    this.entries.push(entry)
    console.warn(`[WARN] ${message}`, data ?? '')
  }

  error(message: string, data?: Record<string, any>): void {
    const entry: LogEntry = { level: 'error', message, data, timestamp: new Date() }
    this.entries.push(entry)
    console.error(`[ERROR] ${message}`, data ?? '')
  }

  getEntries(): LogEntry[] {
    return this.entries.slice(-this.maxEntries)
  }

  clear(): void {
    this.entries = []
  }
}
