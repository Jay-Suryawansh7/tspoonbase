export function isRequired(value: any): Error | null {
  if (value === null || value === undefined || value === '') {
    return new Error('Required field')
  }
  return null
}

export function isEmail(value: string): Error | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return new Error('Invalid email format')
  }
  return null
}

export function isURL(value: string): Error | null {
  try {
    new URL(value)
    return null
  } catch {
    return new Error('Invalid URL format')
  }
}

export function minLength(value: string, min: number): Error | null {
  if (value.length < min) {
    return new Error(`Minimum length is ${min}`)
  }
  return null
}

export function maxLength(value: string, max: number): Error | null {
  if (value.length > max) {
    return new Error(`Maximum length is ${max}`)
  }
  return null
}

export function minNumber(value: number, min: number): Error | null {
  if (value < min) {
    return new Error(`Minimum value is ${min}`)
  }
  return null
}

export function maxNumber(value: number, max: number): Error | null {
  if (value > max) {
    return new Error(`Maximum value is ${max}`)
  }
  return null
}

export function isOneOf(value: any, allowed: any[]): Error | null {
  if (!allowed.includes(value)) {
    return new Error(`Value must be one of: ${allowed.join(', ')}`)
  }
  return null
}

export function matchesPattern(value: string, pattern: string): Error | null {
  if (!new RegExp(pattern).test(value)) {
    return new Error('Does not match required pattern')
  }
  return null
}

export function isInboxEmail(value: string): Error | null {
  const disposableDomains = [
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  ]
  const domain = value.split('@')[1]?.toLowerCase()
  if (disposableDomains.includes(domain)) {
    return new Error('Disposable email addresses are not allowed')
  }
  return null
}
