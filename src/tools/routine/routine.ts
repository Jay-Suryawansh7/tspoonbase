export function fireAndForget(fn: () => Promise<void> | void): void {
  Promise.resolve().then(() => fn()).catch(err => {
    console.error('Background task failed:', err)
  })
}

export async function runParallel<T>(tasks: Array<() => Promise<T>>, concurrency = 10): Promise<T[]> {
  const results: T[] = []
  let index = 0

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const taskIndex = index++
      results[taskIndex] = await tasks[taskIndex]()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  await Promise.all(workers)

  return results
}
