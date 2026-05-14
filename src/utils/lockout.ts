// FIXED[M-6]: Per-account lockout after consecutive failed auth attempts
interface LockoutEntry {
  count: number
  windowStart: number
}

const attempts = new Map<string, LockoutEntry>()
const LOCKOUT_THRESHOLD = 10
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000

export function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.windowStart > LOCKOUT_WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now })
  } else {
    entry.count++
  }
}

export function isLockedOut(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry) return false
  if (now - entry.windowStart > LOCKOUT_WINDOW_MS) {
    attempts.delete(key)
    return false
  }
  return entry.count >= LOCKOUT_THRESHOLD
}

export function clearAttempts(key: string): void {
  attempts.delete(key)
}
