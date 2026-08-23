/**
 * Regression Test: Solarch Init Database Intent Contract (Phase 6 Invariant)
 *
 * Invariant: CLI never collects database credentials during init.
 * CLI only collects database intent.
 *
 * Database URLs enter Solarch only through:
 * 1. `solarch db provision` -> Platform creates database -> Environment secret injection
 * 2. `solarch project sync` -> .env updated securely
 * Never through `solarch init`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { promptInit } from '../../ui/prompts/init.js'
import * as textModule from '../../ui/prompts/text.js'
import * as selectModule from '../../ui/prompts/select.js'
import * as multiselectModule from '../../ui/prompts/multiselect.js'
import { runInit } from '../init/index.js'

describe('Init Database Intent Contract (Regression Tests)', () => {
  let tempBaseDir: string

  beforeEach(() => {
    vi.restoreAllMocks()
    tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solarch-intent-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempBaseDir)) {
      fs.rmSync(tempBaseDir, { recursive: true, force: true })
    }
  })

  it('1. does not request postgres url during init prompt flow', async () => {
    const textPromptSpy = vi.spyOn(textModule, 'promptText').mockImplementation(async (opts) => {
      // If promptText is ever called asking for PostgreSQL URL, fail the test
      if (opts.message.toLowerCase().includes('url') || opts.message.toLowerCase().includes('connection')) {
        throw new Error(`Unexpected credential prompt: "${opts.message}"`)
      }
      return 'intent-pg-app'
    })

    vi.spyOn(selectModule, 'promptSelect')
      .mockResolvedValueOnce('saas')       // 1. Application Type
      .mockResolvedValueOnce('cloud')      // 3. Deployment Model
      .mockResolvedValueOnce('postgres')   // 4. Database Engine
      .mockResolvedValueOnce('local')      // 5. Database Setup (intent only: local / linked / later)
      .mockResolvedValueOnce('none')       // 10. Plugin mode

    vi.spyOn(multiselectModule, 'promptMultiSelect')
      .mockResolvedValueOnce(['auth'])     // 7. Capabilities
      .mockResolvedValueOnce([])           // 8. SDKs

    const config = await promptInit()

    expect(config.name).toBe('intent-pg-app')
    expect(config.database).toBe('postgres')
    expect(config.dbSetup).toBe('local')
    expect(config.databaseUrl).toBeUndefined()

    // Ensure promptText was ONLY called for project name, never for credentials
    const textPromptCalls = textPromptSpy.mock.calls
    expect(textPromptCalls.length).toBe(1)
    expect(textPromptCalls[0][0].message).toBe('Project name')
  })

  it('2. does not write database url into generated solarch.config.ts', async () => {
    await runInit({
      yes: true,
      dir: tempBaseDir,
      name: 'clean-pg-app',
      db: 'postgres',
      exitOnComplete: false,
    })

    const projectDir = path.join(tempBaseDir, 'clean-pg-app')
    const configPath = path.join(projectDir, 'solarch.config.ts')
    expect(fs.existsSync(configPath)).toBe(true)

    const solarchConfig = fs.readFileSync(configPath, 'utf-8')
    expect(solarchConfig).toContain("database: { type: 'postgres' }")
    expect(solarchConfig).not.toContain('DATABASE_URL')
    expect(solarchConfig).not.toContain('url:')
    expect(solarchConfig).not.toContain('connectionString')
  })

  it('3. scaffolds SaaS template with PostgreSQL intent without requiring credentials', async () => {
    await runInit({
      yes: true,
      dir: tempBaseDir,
      name: 'saas-intent-app',
      template: 'saas',
      db: 'postgres',
      exitOnComplete: false,
    })

    const projectDir = path.join(tempBaseDir, 'saas-intent-app')
    const configPath = path.join(projectDir, 'solarch.config.ts')
    const manifestPath = path.join(projectDir, '.solarch', 'project.json')

    expect(fs.existsSync(configPath)).toBe(true)
    expect(fs.existsSync(manifestPath)).toBe(true)

    const solarchConfig = fs.readFileSync(configPath, 'utf-8')
    expect(solarchConfig).toContain("database: { type: 'postgres' }")
    expect(solarchConfig).not.toContain('DATABASE_URL')

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    expect(manifest.database.engine).toBe('postgres')
    expect(manifest.database.credentials).toBeUndefined()
  })

  it('4. preserves database setup intent mode (local/linked/later) cleanly', async () => {
    // Linked intent
    await runInit({
      yes: true,
      dir: tempBaseDir,
      name: 'linked-pg-app',
      db: 'postgres',
      dbSetup: 'linked',
      exitOnComplete: false,
    })

    const linkedDir = path.join(tempBaseDir, 'linked-pg-app')
    expect(fs.existsSync(path.join(linkedDir, 'solarch.config.ts'))).toBe(true)
    // In linked mode, docker-compose.yml is not generated because database is platform-managed
    expect(fs.existsSync(path.join(linkedDir, 'docker-compose.yml'))).toBe(false)

    // Later intent
    await runInit({
      yes: true,
      dir: tempBaseDir,
      name: 'later-pg-app',
      db: 'postgres',
      dbSetup: 'later',
      exitOnComplete: false,
    })

    const laterDir = path.join(tempBaseDir, 'later-pg-app')
    expect(fs.existsSync(path.join(laterDir, 'solarch.config.ts'))).toBe(true)
    expect(fs.existsSync(path.join(laterDir, 'docker-compose.yml'))).toBe(false)
  })

  it('5. does not request MongoDB URI/URL or connection string during init', async () => {
    const textPromptSpy = vi.spyOn(textModule, 'promptText').mockImplementation(async (opts) => {
      if (opts.message.toLowerCase().includes('uri') || opts.message.toLowerCase().includes('url') || opts.message.toLowerCase().includes('connection')) {
        throw new Error(`Unexpected credential prompt for MongoDB: "${opts.message}"`)
      }
      return 'ai-mongo-app'
    })

    vi.spyOn(selectModule, 'promptSelect')
      .mockResolvedValueOnce('ai')          // 1. Application Type
      .mockResolvedValueOnce('cloud')       // 3. Deployment Model
      .mockResolvedValueOnce('mongodb')     // 4. Database Engine
      .mockResolvedValueOnce('local')       // 5. Database Setup
      .mockResolvedValueOnce('none')        // 10. Plugin mode

    vi.spyOn(multiselectModule, 'promptMultiSelect')
      .mockResolvedValueOnce(['auth', 'ai'])  // 7. Capabilities
      .mockResolvedValueOnce(['solarch-ai'])  // 8. SDKs

    const config = await promptInit()

    expect(config.name).toBe('ai-mongo-app')
    expect(config.database).toBe('mongodb')
    expect(config.databaseUrl).toBeUndefined()
    expect(textPromptSpy).toHaveBeenCalledTimes(1)
  })

  it('6. Custom / Minimal application with AI capability selects solarch-ai SDK', async () => {
    vi.spyOn(textModule, 'promptText').mockResolvedValueOnce('custom-ai-app')

    vi.spyOn(selectModule, 'promptSelect')
      .mockResolvedValueOnce('custom')     // 1. Application Type
      .mockResolvedValueOnce('local')      // 3. Deployment Model
      .mockResolvedValueOnce('sqlite')     // 4. Database Engine
      .mockResolvedValueOnce('none')       // 10. Plugin mode

    vi.spyOn(multiselectModule, 'promptMultiSelect')
      .mockResolvedValueOnce(['ai', 'vector'])    // 7. Capabilities: AI features + Vector search
      .mockResolvedValueOnce(['solarch-ai'])      // 8. SDKs

    const config = await promptInit()

    expect(config.name).toBe('custom-ai-app')
    expect(config.ai).toBe(true)
    expect(config.sdks).toEqual(['solarch-ai'])
    expect(config.plan?.sdks.selected).toEqual(['solarch-ai'])
    expect(config.plan?.intent.features.ai).toBe(true)
  })
})

