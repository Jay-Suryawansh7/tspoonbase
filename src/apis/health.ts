import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'

export function registerHealthRoutes(app: BaseApp, router: Router): void {
  router.get('/api/health', async (req: Request, res: Response) => {
    res.json({
      code: 200,
      message: 'Healthy',
      timestamp: new Date().toISOString(),
    })
  })
}
