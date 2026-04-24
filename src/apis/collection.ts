import { Router, Request, Response } from 'express'
import { BaseApp } from '../core/base'
import { Collection } from '../core/collection'
import { syncRecordTableSchema, createRecordTable } from '../core/schema_sync'

export function registerCollectionRoutes(app: BaseApp, router: Router): void {
  const collectionRouter = Router()

  collectionRouter.get('/', async (req: Request, res: Response) => {
    try {
      const collections = await app.findAllCollections()
      res.json({
        page: 1,
        perPage: collections.length,
        totalItems: collections.length,
        totalPages: 1,
        items: collections.map(c => c.toJSON()),
      })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  collectionRouter.get('/:idOrName', async (req: Request, res: Response) => {
    try {
      const collection = await app.findCollectionByNameOrId(req.params.idOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }
      res.json(collection.toJSON())
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  collectionRouter.post('/', async (req: Request, res: Response) => {
    try {
      const collection = new Collection(req.body)
      await app.save(collection)

      // Create record table using schema sync
      await createRecordTable(app, collection)

      res.status(201).json(collection.toJSON())
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  collectionRouter.patch('/:idOrName', async (req: Request, res: Response) => {
    try {
      const collection = await app.findCollectionByNameOrId(req.params.idOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }

      Object.assign(collection, req.body)
      await app.save(collection)

      // Sync schema after update
      await syncRecordTableSchema(app, collection)

      res.json(collection.toJSON())
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  collectionRouter.delete('/:idOrName', async (req: Request, res: Response) => {
    try {
      const collection = await app.findCollectionByNameOrId(req.params.idOrName)
      if (!collection) {
        return res.status(404).json({ code: 404, message: 'Collection not found.' })
      }
      await app.delete(collection)
      res.status(204).send()
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  collectionRouter.post('/import', async (req: Request, res: Response) => {
    try {
      const { collections, deleteMissing } = req.body
      const imported: string[] = []

      for (const colData of collections) {
        const existing = await app.findCollectionByNameOrId(colData.name)
        if (existing) {
          Object.assign(existing, colData)
          await app.save(existing)
          await syncRecordTableSchema(app, existing)
          imported.push(existing.id)
        } else {
          const collection = new Collection(colData)
          await app.save(collection)
          await createRecordTable(app, collection)
          imported.push(collection.id)
        }
      }

      res.json({ imported })
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  collectionRouter.post('/export', async (req: Request, res: Response) => {
    try {
      const collections = await app.findAllCollections()
      res.json(collections.map(c => c.toJSON()))
    } catch (err: any) {
      res.status(500).json({ code: 500, message: err.message })
    }
  })

  router.use('/api/collections', collectionRouter)
}
