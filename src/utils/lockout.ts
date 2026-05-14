// FIXED[M-6]: Per-account lockout after consecutive failed auth attempts
// FIXED[M-2]: LRU-evictable cache capped at 50k entries with periodic sweep
interface LockoutEntry {
  count: number
  windowStart: number
}

const MAX_LOCKOUT_ENTRIES = 50000
const attempts = new Map<string, LockoutEntry>()
const LOCKOUT_THRESHOLD = 10
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000

function evictStaleLockoutEntries(): void {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (now - entry.windowStart > LOCKOUT_WINDOW_MS) {
      attempts.delete(key)
    }
  }
}

// Sweep expired entries every 10 minutes
setInterval(evictStaleLockoutEntries, 10 * 60 * 1000)

function lruTouch(key: string): void {
  if (attempts.has(key)) {
    const entry = attempts.get(key)!
    attempts.delete(key)
    attempts.set(key, entry)
  }
}

export function recordFailedAttempt(key: string): void {
  // Evict one stale entry if at capacity to keep Map bounded
  if (attempts.size >= MAX_LOCKOUT_ENTRIES) {
    const oldestKey = attempts.keys().next().value
    if (oldestKey !== undefined) attempts.delete(oldestKey)
  }

  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now - entry.windowStart > LOCKOUT_WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now })
  } else {
    entry.count++
    lruTouch(key)
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
  lruTouch(key)
  return entry.count >= LOCKOUT_THRESHOLD
}

export function clearAttempts(key: string): void {
  attempts.delete(key)
}
