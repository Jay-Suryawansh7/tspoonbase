import { LocalBlobDriver } from './blob/driver'
import { BlobDriver } from './blob/driver'
import { S3Config } from '../../core/settings'
import fs from 'fs'
import path from 'path'

export interface FilesystemConfig {
  dataDir: string
  s3Config?: S3Config
}

export class Filesystem {
  private driver: BlobDriver
  private s3Config?: S3Config

  constructor(config: FilesystemConfig) {
    if (config.s3Config?.enabled) {
      this.s3Config = config.s3Config
      this.driver = new S3BlobDriver(config.s3Config)
    } else {
      this.driver = new LocalBlobDriver(path.join(config.dataDir, 'storage'))
    }
  }

  getDriver(): BlobDriver {
    return this.driver
  }

  async listFiles(prefix?: string): Promise<any[]> {
    return this.driver.list(prefix)
  }

  async getFile(key: string): Promise<any> {
    return this.driver.get(key)
  }

  async putFile(key: string, content: any, size?: number): Promise<void> {
    return this.driver.put(key, content, size)
  }

  async deleteFile(key: string): Promise<void> {
    return this.driver.delete(key)
  }

  async fileExists(key: string): Promise<boolean> {
    return this.driver.exists(key)
  }

  async getFileUrl(key: string): Promise<string> {
    return this.driver.url(key)
  }

  close(): void {
  }
}

class S3BlobDriver extends BlobDriver {
  private config: S3Config

  constructor(config: S3Config) {
    super()
    this.config = config
  }

  async list(prefix?: string): Promise<any[]> {
    throw new Error('S3 driver not fully implemented')
  }

  async get(key: string): Promise<any> {
    throw new Error('S3 driver not fully implemented')
  }

  async put(key: string, content: any, size?: number): Promise<void> {
    throw new Error('S3 driver not fully implemented')
  }

  async delete(key: string): Promise<void> {
    throw new Error('S3 driver not fully implemented')
  }

  async exists(key: string): Promise<boolean> {
    throw new Error('S3 driver not fully implemented')
  }

  async url(key: string): Promise<string> {
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${this.config.prefix || ''}${key}`
  }
}
