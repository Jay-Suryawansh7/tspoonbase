import { Router, Request, Response } from 'express'
import multer from 'multer'
import { BaseApp } from '../core/base'
import { requireSuperuserAuth } from './middlewares_auth'
import path from 'path'
import fs from 'fs'
import fsPromises from 'fs/promises'

const BACKUP_FILE_SIZE_LIMIT = 1024 * 1024 * 1024

function checkpointWalIfPossible(app: BaseApp): void {
  try {
    app.db().getDataDB().exec('PRAGMA wal_checkpoint(TRUNCATE)')
    app.db().getAuxDB().exec('PRAGMA wal_checkpoint(TRUNCATE)')
  } catch {
    // WAL checkpoint is best-effort during backup creation
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath)
    return true
  } catch {
    return false
  }
}

export function registerBackupRoutes(app: BaseApp, router: Router): void {
  // One-time synchronous creation is acceptable (startup cost, not request-path)
  const backupDir = (() => {
    const dir = path.join(app.dataDir, 'backups')
    fs.mkdirSync(dir, { recursive: true })
    return dir
  })()

  router.get('/api/backups', requireSuperuserAuth(app), async (_req: Request, res: Response) => {
    try {
      if (!await pathExists(backupDir)) {
        return res.json([])
      }

      // FIXED[H-2]: Use async fs/promises
      const entries = await fsPromises.readdir(backupDir)
      const zipFiles = entries.filter(f => f.endsWith('.zip'))
      const files = await Promise.all(zipFiles.map(async (file: string) => {
        const stat = await fsPromises.stat(path.join(backupDir, file))
        return {
          key: file,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        }
      }))
      files.sort((a: any, b: any) => b.modified.localeCompare(a.modified))

      res.json(files)
    } catch (err: any) {
      app.logger().error(err.message || err)
      res.status(500).json({ code: 500, message: 'Internal server error' })
    }
  })

  router.post('/api/backups', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      const { name } = req.body
      const sanitized = name
        ? name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\./g, '_')
        : `backup_${Date.now()}`
      const backupName = sanitized.endsWith('.zip') ? sanitized : `${sanitized}.zip`
      const backupPath = path.join(backupDir, backupName)

      // FIXED[H-2]: Use async fs/promises
      if (await pathExists(backupPath)) {
        return res.status(409).json({ code: 409, message: `Backup "${backupName}" already exists` })
      }

      checkpointWalIfPossible(app)

      const JSZip = require('jszip')
      const zip = new JSZip()

      const dbFiles = ['data.db', 'auxiliary.db']
      for (const dbFile of dbFiles) {
        const dbPath = path.join(app.dataDir, dbFile)
        if (await pathExists(dbPath)) {
          zip.file(dbFile, await fsPromises.readFile(dbPath))
        }
      }

      const storageDir = path.join(app.dataDir, 'storage')
      // FIXED[H-2]: Use async fs/promises
      if (await pathExists(storageDir)) {
        const addDirToZip = async (dirPath: string, zipPath: string) => {
          const entries = await fsPromises.readdir(dirPath, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)
            const zipEntryPath = zipPath ? `${zipPath}/${entry.name}` : entry.name
            if (entry.isDirectory()) {
              await addDirToZip(fullPath, zipEntryPath)
            } else {
              zip.file(`storage/${zipEntryPath}`, await fsPromises.readFile(fullPath))
            }
          }
        }
        await addDirToZip(storageDir, '')
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
      await fsPromises.writeFile(backupPath, zipBuffer)

      try {
        await app.onBackupCreate.trigger({ app, name: backupName })
      } catch {
        // hook errors should not block the response
      }

      const stat = await fsPromises.stat(backupPath)
      res.json({
        code: 200,
        data: {
          key: backupName,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        },
      })
    } catch (err: any) {
      app.logger().error(err.message || err)
      res.status(500).json({ code: 500, message: 'Internal server error' })
    }
  })

  const upload = multer({
    dest: backupDir,
    limits: { fileSize: BACKUP_FILE_SIZE_LIMIT },
  })

  router.post('/api/backups/upload', requireSuperuserAuth(app), upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ code: 400, message: 'No file provided' })
      }

      const originalName = req.file.originalname || `uploaded_${Date.now()}.zip`
      const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\./g, '_')
      const targetPath = path.join(backupDir, sanitized)

      // FIXED[H-2]: Use async fs/promises
      if (await pathExists(targetPath)) {
        await fsPromises.unlink(req.file.path)
        return res.status(409).json({ code: 409, message: `Backup "${sanitized}" already exists` })
      }

      await fsPromises.rename(req.file.path, targetPath)

      const stat = await fsPromises.stat(targetPath)
      res.json({
        code: 200,
        data: {
          key: sanitized,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        },
      })
    } catch (err: any) {
      if (req.file && await pathExists(req.file.path)) {
        await fsPromises.unlink(req.file.path)
      }
      app.logger().error(err.message || err)
      res.status(500).json({ code: 500, message: 'Internal server error' })
    }
  })

  router.post('/api/backups/:key/restore', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      const backupKey = path.basename(req.params.key).replace(/\.\./g, '')
      const backupPath = path.join(backupDir, backupKey)

      // FIXED[H-2]: Use async fs/promises
      if (!await pathExists(backupPath)) {
        return res.status(404).json({ code: 404, message: `Backup "${backupKey}" not found` })
      }

      const JSZip = require('jszip')
      const zipData = await fsPromises.readFile(backupPath)
      const zip = await JSZip.loadAsync(zipData)

      app.db().getDataDB().exec('PRAGMA wal_checkpoint(TRUNCATE)')
      app.db().getAuxDB().exec('PRAGMA wal_checkpoint(TRUNCATE)')
      app.resetBootstrapState()

      const restoreDir = path.join(app.dataDir, '.restore_temp')
      // FIXED[H-2]: Use async fs/promises
      if (await pathExists(restoreDir)) {
        await fsPromises.rm(restoreDir, { recursive: true })
      }
      await fsPromises.mkdir(restoreDir, { recursive: true })

      const zipEntries = Object.entries(zip.files) as [string, any][]
      for (const [zipPath, zipEntry] of zipEntries) {
        if (zipEntry.dir) continue
        const targetFile = path.join(restoreDir, zipPath)
        // Zip slip protection: ensure resolved path stays within restoreDir
        const resolved = path.resolve(targetFile)
        const base = path.resolve(restoreDir)
        if (!resolved.startsWith(base + path.sep)) {
          throw new Error(`Zip slip detected: entry "${zipPath}" would escape restore directory`)
        }
        await fsPromises.mkdir(path.dirname(targetFile), { recursive: true })
        const content = await zipEntry.async('nodebuffer')
        await fsPromises.writeFile(targetFile, content)
      }

      const restoreDbFiles = ['data.db', 'auxiliary.db']
      for (const dbFile of restoreDbFiles) {
        const src = path.join(restoreDir, dbFile)
        const dst = path.join(app.dataDir, dbFile)
        if (await pathExists(src)) {
          const walFile = `${dst}-wal`
          const shmFile = `${dst}-shm`
          if (await pathExists(walFile)) await fsPromises.unlink(walFile)
          if (await pathExists(shmFile)) await fsPromises.unlink(shmFile)
          await fsPromises.copyFile(src, dst)
        }
      }

      const restoreStorageDir = path.join(restoreDir, 'storage')
      const appStorageDir = path.join(app.dataDir, 'storage')
      if (await pathExists(restoreStorageDir)) {
        if (await pathExists(appStorageDir)) {
          await fsPromises.rm(appStorageDir, { recursive: true })
        }
        await fsPromises.mkdir(path.dirname(appStorageDir), { recursive: true })
        await fsPromises.cp(restoreStorageDir, appStorageDir, { recursive: true })
      }

      await fsPromises.rm(restoreDir, { recursive: true })

      await app.bootstrap()

      try {
        await app.onBackupRestore.trigger({ app, name: backupKey })
      } catch {
        // hook errors should not block the response
      }

      res.json({ code: 200, message: `Backup "${backupKey}" restored successfully` })
    } catch (err: any) {
      app.logger().error(err.message || err)
      res.status(500).json({ code: 500, message: 'Internal server error' })
    }
  })

  router.delete('/api/backups/:key', requireSuperuserAuth(app), async (req: Request, res: Response) => {
    try {
      const backupKey = path.basename(req.params.key).replace(/\.\./g, '')
      const backupPath = path.join(backupDir, backupKey)

      // FIXED[H-2]: Use async fs/promises
      if (!await pathExists(backupPath)) {
        return res.status(404).json({ code: 404, message: `Backup "${backupKey}" not found` })
      }

      await fsPromises.unlink(backupPath)
      res.status(204).send()
    } catch (err: any) {
      app.logger().error(err.message || err)
      res.status(500).json({ code: 500, message: 'Internal server error' })
    }
  })
}
