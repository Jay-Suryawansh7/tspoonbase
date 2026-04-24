import { describe, it, expect, beforeEach } from 'vitest'
import { BaseApp } from '../src/core/base'
import { AIService } from '../src/ai/service'

describe('AIService', () => {
  let app: BaseApp
  let ai: AIService

  beforeEach(async () => {
    const dataDir = `./test_data_ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    app = new BaseApp({ isDev: true, dataDir })
    await app.bootstrap()
    ai = new AIService(app)
  })

  it('should throw when AI is not configured', async () => {
    await expect(ai.chat('hello')).rejects.toThrow('AI is not configured')
  })

  it('should throw when generating collection without config', async () => {
    await expect(ai.generateCollection('A blog post')).rejects.toThrow('AI is not configured')
  })

  it('should throw when generating rule without config', async () => {
    await expect(ai.generateRule('update', 'only owner')).rejects.toThrow('AI is not configured')
  })

  it('should throw when seeding without config', async () => {
    await expect(ai.seedRecords('posts', 5)).rejects.toThrow('AI is not configured')
  })
})
