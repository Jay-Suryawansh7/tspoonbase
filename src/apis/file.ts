import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { RecordModel as PBRecord } from '../core/record'
import { canAccessRecord } from './record_helpers'
import { RequestInfo } from '../core/record_field_resolver'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { createHash } from 'crypto'
import { Readable } from 'stream'

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`))
  }
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
})

function generateFileToken(app: BaseApp, collectionId: string, recordId: string, filename: string): string {
  return app.generateJWT(
    { type: 'file', collectionId, recordId, filename },
    app.settings().appName || 'secret',
    '1h'
  )
}

function verifyFileToken(app: BaseApp, token: string): { collectionId: string; recordId: string; filename: string } | null {
  try {
    const payload = app.parseJWT(token, app.settings().appName || 'secret')
    if (!payload || payload.type !== 'file') return null
    return { collectionId: payload.collectionId, recordId: payload.recordId, filename: payload.filename }
  } catch {
    return null
  }
}

export function registerFileRoutes(app: BaseApp, router: Router): void {
  // Generate protected file token
  router.post('/api/files/token', async (req: Request, res: Response) => {
    try {
      const { collection: collectionIdOrName, recordId, filename } = req.body
      if (!collectionIdOrName || !recordId || !filename) {
        return res.status(400).json({ code: 400, message: 'Missing collection, recordId, or filename.' })
      }

      const collection = await app.findCollectionByNameOrId(collectionIdOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(recordId) as any
      if (!row) {
        return res.status(404).json({ code: 404, message: 'Record not found.' })
      }

      const record = new PBRecord(collection.id, collection.name, row)

      // Check viewRule for file access
      const requestInfo: RequestInfo = {
        auth: req.authContext?.record ?? null,
        isAdmin: req.authContext?.isAdmin ?? false,
        method: req.method,
        headers: req.headers as Record<string, string>,
        query: req.query as Record<string, string>,
        body: req.body,
        data: req.body,
        context: 'view',
      }

      if (collection.viewRule !== null) {
        const accessible = await canAccessRecord(app, record, collection, collection.viewRule, requestInfo)
        if (!accessible) {
          return res.status(403).json({ code: 403, message: 'File access denied.' })
        }
      }

      const token = generateFileToken(app, collection.id, recordId, filename)
      res.json({ token })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  // File upload endpoint
  router.post('/api/collections/:collectionIdOrName/records/:recordId/files', upload.array('files', 10), async (req: Request, res: Response) => {
    try {
      const { collectionIdOrName, recordId } = req.params
      const collection = await app.findCollectionByNameOrId(collectionIdOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(recordId) as any
      if (!row) {
        return res.status(404).json({ code: 404, message: 'Record not found.' })
      }

      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).json({ code: 400, message: 'No files uploaded.' })
      }

      const fsys = app.getFilesystem()
      const storageBase = path.join(app.dataDir, 'storage', collection.name, recordId)
      fs.mkdirSync(storageBase, { recursive: true })

      const savedFiles: string[] = []
      const thumbsGenerated: string[] = []

      for (const file of files) {
        const ext = path.extname(file.originalname)
        const baseName = path.basename(file.originalname, ext)
        const safeName = `${baseName}${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_')
        const destPath = path.join(storageBase, safeName)
        const storageKey = path.join(collection.name, recordId, safeName)

        const fileContent = fs.readFileSync(file.path)
        await fsys.putFile(storageKey, fileContent)
        fs.unlinkSync(file.path)
        savedFiles.push(safeName)

        // Generate thumbnails for image files
        if (isImageFile(safeName)) {
          const thumbs = await generateThumbnails(destPath, storageBase, baseName, ext, app)
          thumbsGenerated.push(...thumbs)
        }
      }

      // Update record with file references
      const fieldName = req.query.field as string || 'files'
      const record = new PBRecord(collection.id, collection.name, row)
      const existingFiles = record.get(fieldName) || []
      const allFiles = Array.isArray(existingFiles) ? [...existingFiles, ...savedFiles] : savedFiles
      record.set(fieldName, allFiles)
      await app.save(record)

      res.status(200).json({
        files: savedFiles,
        thumbs: thumbsGenerated,
      })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  // File download endpoint
  router.get('/api/files/:collectionIdOrName/:recordId/:filename', async (req: Request, res: Response) => {
    try {
      const { collectionIdOrName, recordId, filename } = req.params
      const thumb = req.query.thumb as string
      const download = req.query.download === '1'
      const fileToken = req.query.token as string

      const collection = await app.findCollectionByNameOrId(collectionIdOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(recordId) as any
      if (!row) {
        return res.status(404).json({ code: 404, message: 'Record not found.' })
      }

      const record = new PBRecord(collection.id, collection.name, row)

      // If a file token is provided, verify it first
      if (fileToken) {
        const tokenPayload = verifyFileToken(app, fileToken)
        if (!tokenPayload || tokenPayload.collectionId !== collection.id || tokenPayload.recordId !== recordId || tokenPayload.filename !== filename) {
          return res.status(403).json({ code: 403, message: 'Invalid or expired file token.' })
        }
      } else {
        // Otherwise check viewRule for file access
        const requestInfo: RequestInfo = {
          auth: req.authContext?.record ?? null,
          isAdmin: req.authContext?.isAdmin ?? false,
          method: req.method,
          headers: req.headers as Record<string, string>,
          query: req.query as Record<string, string>,
          body: req.body,
          data: req.body,
          context: 'view',
        }

        if (collection.viewRule !== null) {
          const accessible = await canAccessRecord(app, record, collection, collection.viewRule, requestInfo)
          if (!accessible) {
            return res.status(404).json({ code: 404, message: 'File not found.' })
          }
        }
      }

      const fsys = app.getFilesystem()
      const isS3 = app.settings().s3?.enabled

      if (isS3) {
        const storageKey = thumb
          ? path.join(collection.name, recordId, `${path.basename(filename, path.extname(filename))}_${thumb}${path.extname(filename)}`)
          : path.join(collection.name, recordId, filename)

        const exists = await fsys.fileExists(storageKey)
        if (!exists) {
          return res.status(404).json({ code: 404, message: 'File not found.' })
        }

        if (download) {
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        }

        const stream = await fsys.getFile(storageKey) as Readable
        stream.pipe(res)
      } else {
        let filePath: string
        if (thumb) {
          filePath = path.join(app.dataDir, 'storage', collection.name, recordId, `${path.basename(filename, path.extname(filename))}_${thumb}${path.extname(filename)}`)
        } else {
          filePath = path.join(app.dataDir, 'storage', collection.name, recordId, filename)
        }

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ code: 404, message: 'File not found.' })
        }

        if (download) {
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        }

        res.sendFile(path.resolve(filePath))
      }
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  // File delete endpoint
  router.delete('/api/collections/:collectionIdOrName/records/:recordId/files/:filename', async (req: Request, res: Response) => {
    try {
      const { collectionIdOrName, recordId, filename } = req.params
      const collection = await app.findCollectionByNameOrId(collectionIdOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }

      const db = app.db().getDataDB()
      const row = db.prepare(`SELECT * FROM _r_${collection.id} WHERE id = ?`).get(recordId) as any
      if (!row) {
        return res.status(404).json({ code: 404, message: 'Record not found.' })
      }

      const fsys = app.getFilesystem()
      const storageBase = path.join(app.dataDir, 'storage', collection.name, recordId)
      const filePath = path.join(storageBase, filename)

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      await fsys.deleteFile(path.join(collection.name, recordId, filename)).catch(() => {})

      // Delete associated thumbnails
      const baseName = path.basename(filename, path.extname(filename))
      const ext = path.extname(filename)
      if (fs.existsSync(storageBase)) {
        const thumbs = fs.readdirSync(storageBase).filter(f => f.startsWith(`${baseName}_thumb`))
        for (const thumb of thumbs) {
          fs.unlinkSync(path.join(storageBase, thumb))
          await fsys.deleteFile(path.join(collection.name, recordId, thumb)).catch(() => {})
        }
      }

      // Update record
      const record = new PBRecord(collection.id, collection.name, row)
      const fieldName = req.query.field as string || 'files'
      const existingFiles = record.get(fieldName) || []
      if (Array.isArray(existingFiles)) {
        record.set(fieldName, existingFiles.filter((f: string) => f !== filename))
        await app.save(record)
      }

      res.status(204).send()
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)
}

async function generateThumbnails(
  sourcePath: string,
  storageBase: string,
  baseName: string,
  ext: string,
  app: BaseApp
): Promise<string[]> {
  const thumbs: string[] = []
  const sizes = [
    { suffix: 'thumb_100x100', width: 100, height: 100 },
    { suffix: 'thumb_300x300', width: 300, height: 300 },
    { suffix: 'thumb_500x500', width: 500, height: 500 },
  ]

  try {
    // Try to use sharp if available, otherwise skip thumbnail generation
    let sharp: any
    try {
      sharp = require('sharp')
    } catch {
      app.logger().warn('sharp not installed, skipping thumbnail generation')
      return thumbs
    }

    for (const size of sizes) {
      const thumbPath = path.join(storageBase, `${baseName}_${size.suffix}${ext}`)
      await sharp(sourcePath)
        .resize(size.width, size.height, { fit: 'cover', withoutEnlargement: true })
        .toFile(thumbPath)
      thumbs.push(`${baseName}_${size.suffix}${ext}`)
    }
  } catch (err: any) {
    app.logger().error('Thumbnail generation failed', err.message)
  }

  return thumbs
}
