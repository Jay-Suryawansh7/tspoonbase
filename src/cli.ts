#!/usr/bin/env node

import { Command } from 'commander'
import { TspoonBase } from './pocketbase'
import { readFileSync } from 'fs'
import { join } from 'path'

const program = new Command()

const packageJsonPath = join(__dirname, '..', 'package.json')
let version = '0.1.0'
try {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  version = pkg.version
} catch {}

program
  .name('tspoonbase')
  .description('TspoonBase - TypeScript backend-as-a-service')
  .version(version)

program
  .option('--dev', 'enable dev mode')
  .option('--dir <path>', 'data directory', './pb_data')
  .option('--encryptionEnv <env>', 'encryption environment variable')
  .option('--queryTimeout <seconds>', 'query timeout in seconds', '30')

program
  .command('serve')
  .description('start the server')
  .option('--port <number>', 'port number', '8090')
  .option('--hideStartBanner', 'hide start banner')
  .action(async (opts) => {
    const dev = program.opts().dev ?? false
    const dataDir = program.opts().dir ?? './pb_data'
    const encryptionEnv = program.opts().encryptionEnv
    const queryTimeout = parseInt(program.opts().queryTimeout, 10)

    const app = new TspoonBase({
      hideStartBanner: opts.hideStartBanner,
      defaultDev: dev,
      defaultDataDir: dataDir,
      defaultEncryptionEnv: encryptionEnv,
      defaultQueryTimeout: queryTimeout,
    })

    await app.start(parseInt(opts.port, 10))
  })

program
  .command('superuser')
  .description('create superuser account')
  .option('--email <email>', 'superuser email')
  .option('--password <password>', 'superuser password')
  .option('--dir <path>', 'data directory', './pb_data')
  .action(async (opts) => {
    const { createSuperuser } = await import('./cmd/superuser')
    await createSuperuser({
      email: opts.email,
      password: opts.password,
      dataDir: opts.dir,
    })
  })

program
  .command('superuser-create')
  .alias('superuser create')
  .description('create superuser account (shorthand: tspoonbase superuser create EMAIL PASS)')
  .argument('[email]', 'superuser email')
  .argument('[password]', 'superuser password')
  .option('--dir <path>', 'data directory', './pb_data')
  .action(async (email, password, opts) => {
    const { createSuperuser } = await import('./cmd/superuser')
    await createSuperuser({
      email,
      password,
      dataDir: opts.dir,
    })
  })

program.parse(process.argv)
