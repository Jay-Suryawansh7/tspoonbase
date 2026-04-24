export function singularize(word: string): string {
  const rules: Array<[RegExp, string]> = [
    [/(.*)ies$/, '$1y'],
    [/(.*)ves$/, '$1fe'],
    [/(.*)ses$/, '$1'],
    [/(.*)zes$/, '$1'],
    [/(.*)xes$/, '$1'],
    [/(.*)oes$/, '$1'],
    [/(.*)s$/, '$1'],
  ]

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement)
    }
  }

  return word
}

export function pluralize(word: string): string {
  const rules: Array<[RegExp, string]> = [
    [/(.*)y$/, '$1ies'],
    [/(.*)fe$/, '$1ves'],
    [/(.*)fe$/, '$1ves'],
    [/(.*)sis$/, '$1ses'],
    [/(.*)xis$/, '$1xes'],
    [/(.*)zis$/, '$1zes'],
    [/(.*)s$/, '$1ses'],
    [/(.*)x$/, '$1xes'],
    [/(.*)z$/, '$1zes'],
  ]

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement)
    }
  }

  return word + 's'
}

export function camelize(word: string): string {
  return word
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^(.)/, char => char.toLowerCase())
}

export function pascalize(word: string): string {
  return word
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^(.)/, char => char.toUpperCase())
}

export function underscore(word: string): string {
  return word
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/[-\s]/g, '_')
    .toLowerCase()
}

export function dasherize(word: string): string {
  return underscore(word).replace(/_/g, '-')
}

export function humanize(word: string): string {
  return underscore(word)
    .replace(/_/g, ' ')
    .replace(/^(.)/, char => char.toUpperCase())
}

export function titleize(word: string): string {
  return humanize(word)
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
