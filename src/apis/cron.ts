import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { Cron } from '../tools/cron/cron'

const cronJobs = new Map<string, any>()

export function registerCronRoutes(app: BaseApp, router: Router): void {
  router.get('/api/crons', async (req: Request, res: Response) => {
    try {
      const settings = app.settings()
      const jobs = Array.from(cronJobs.entries()).map(([id, job]) => ({
        id,
        schedule: job.schedule,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
      }))
      res.json(jobs)
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/crons/:id/run', async (req: Request, res: Response) => {
    try {
      const job = cronJobs.get(req.params.id)
      if (!job) {
        return res.status(404).json({ code: 404, message: 'Cron job not found.' })
      }
      await job.handler()
      res.json({ code: 200, message: 'Cron job executed.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })
}

export function registerCronJob(id: string, schedule: string, handler: () => Promise<void>): void {
  const job = { schedule, handler, lastRun: null, nextRun: null }
  cronJobs.set(id, job)
}
