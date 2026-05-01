import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'

export function registerHealthRoutes(app: BaseApp, router: Router): void {
  router.get('/api/health', async (req: Request, res: Response) => {
    try {
      app.db().getDataDB().exec('SELECT 1')
    } catch {
      return res.status(503).json({ code: 503, message: 'Database unavailable', timestamp: new Date().toISOString() })
    }
    res.json({
      code: 200,
      message: 'Healthy',
      timestamp: new Date().toISOString(),
      data: {
        dbConnected: true,
      },
    })
  })
}
