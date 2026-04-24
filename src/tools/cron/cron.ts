import croner from 'croner'

export interface CronJobConfig {
  name: string
  schedule: string
  handler: () => Promise<void> | void
}

export class Cron {
  private jobs: Map<string, any> = new Map()

  add(config: CronJobConfig): void {
    const job = croner(config.schedule, async () => {
      try {
        await config.handler()
      } catch (err) {
        console.error(`Cron job "${config.name}" failed:`, err)
      }
    })
    this.jobs.set(config.name, job)
  }

  remove(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      job.stop()
      this.jobs.delete(name)
    }
  }

  start(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      job.start()
    }
  }

  stop(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      job.stop()
    }
  }

  stopAll(): void {
    for (const job of this.jobs.values()) {
      job.stop()
    }
  }

  has(name: string): boolean {
    return this.jobs.has(name)
  }

  getJob(name: string): any {
    return this.jobs.get(name)
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys())
  }
}
