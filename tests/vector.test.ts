import { describe, it, expect, beforeEach } from 'vitest'
import { BaseApp } from '../src/core/base'
import { Collection } from '../src/core/collection'
import { VectorField } from '../src/core/field'
import { vectorSearch } from '../src/core/record_query'
import { validateAndCreateRecord } from '../src/core/record_upsert'

describe('VectorField', () => {
  it('should validate correct vector', () => {
    const field = new VectorField({ dimensions: 3 })
    const err = field.validate([0.1, 0.2, 0.3])
    expect(err).toBeNull()
  })

  it('should reject wrong dimensions', () => {
    const field = new VectorField({ dimensions: 3 })
    const err = field.validate([0.1, 0.2])
    expect(err).not.toBeNull()
    expect(err!.message).toContain('Expected 3 dimensions')
  })

  it('should reject non-array values', () => {
    const field = new VectorField({ dimensions: 3 })
    expect(field.validate('not an array')!.message).toContain('array of numbers')
  })

  it('should reject NaN elements', () => {
    const field = new VectorField({ dimensions: 2 })
    const err = field.validate([0.1, NaN])
    expect(err!.message).toContain('numbers')
  })

  it('should serialize toJSON with dimensions', () => {
    const field = new VectorField({ name: 'embedding', dimensions: 768 })
    expect(field.toJSON()).toMatchObject({ name: 'embedding', type: 'vector', dimensions: 768 })
  })
})

describe('vectorSearch', () => {
  let app: BaseApp
  let collection: Collection

  beforeEach(async () => {
    const dataDir = `./test_data_vector_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()

    collection = new Collection({
      name: 'documents',
      type: 'base',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'embedding', type: 'vector', dimensions: 3 } as any,
      ],
    })

    await app.save(collection)

    // Insert test records with vectors
    const records = [
      { title: 'cat', embedding: [1, 0, 0] },
      { title: 'dog', embedding: [0.9, 0.1, 0] },
      { title: 'fish', embedding: [0, 0, 1] },
      { title: 'bird', embedding: [0.5, 0.5, 0] },
    ]

    for (const data of records) {
      const { record, errors } = await validateAndCreateRecord(app, collection, data)
      expect(errors).toHaveLength(0)
      await app.save(record)
    }
  })

  it('should find most similar vectors', async () => {
    const results = await vectorSearch(app, 'documents', 'embedding', [1, 0, 0], 3)
    expect(results.length).toBe(3)
    expect(results[0].record.get('title')).toBe('cat')
    expect(results[0].similarity).toBeCloseTo(1, 5)
    expect(results[1].record.get('title')).toBe('dog')
  })

  it('should respect minSimilarity', async () => {
    const results = await vectorSearch(app, 'documents', 'embedding', [1, 0, 0], 10, 0.9)
    expect(results.length).toBe(2) // cat and dog only
    expect(results.every(r => r.similarity >= 0.9)).toBe(true)
  })

  it('should throw for non-vector field', async () => {
    await expect(vectorSearch(app, 'documents', 'title', [1, 0, 0]))
      .rejects.toThrow('not a vector field')
  })

  it('should throw for invalid field name', async () => {
    await expect(vectorSearch(app, 'documents', 'embedding; DROP TABLE', [1, 0, 0]))
      .rejects.toThrow('Invalid field name')
  })
})
