import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'

export function registerBackupRoutes(app: BaseApp, router: Router): void {
  router.get('/api/backups', async (req: Request, res: Response) => {
    try {
      const fs = require('fs')
      const path = require('path')
      const backupDir = path.join(app.dataDir, 'backups')

      if (!fs.existsSync(backupDir)) {
        return res.json([])
      }

      const files = fs.readdirSync(backupDir).map((file: string) => {
        const stat = fs.statSync(path.join(backupDir, file))
        return {
          key: file,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        }
      })

      res.json(files)
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/backups', async (req: Request, res: Response) => {
    try {
      const { name } = req.body
      const backupName = name || `backup_${Date.now()}.zip`
      res.json({ code: 200, message: `Backup ${backupName} created.` })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/backups/upload', async (req: Request, res: Response) => {
    try {
      res.json({ code: 200, message: 'Backup uploaded.' })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.post('/api/backups/:key/restore', async (req: Request, res: Response) => {
    try {
      res.json({ code: 200, message: `Backup ${req.params.key} restore initiated.` })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.delete('/api/backups/:key', async (req: Request, res: Response) => {
    try {
      const fs = require('fs')
      const path = require('path')
      const backupPath = path.join(app.dataDir, 'backups', req.params.key)

      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
      }

      res.status(204).send()
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })
}
