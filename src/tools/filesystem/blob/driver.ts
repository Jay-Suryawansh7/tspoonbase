import fs from 'fs'
import path from 'path'
import { Readable, Writable } from 'stream'

export interface FileAttributes {
  key: string
  size: number
  modified: Date
  mimeType?: string
  etag?: string
}

export abstract class BlobDriver {
  abstract list(prefix?: string): Promise<FileAttributes[]>
  abstract get(key: string): Promise<Readable>
  abstract put(key: string, content: Readable | Buffer | string, size?: number): Promise<void>
  abstract delete(key: string): Promise<void>
  abstract exists(key: string): Promise<boolean>
  abstract url(key: string): Promise<string>
}

export class LocalBlobDriver extends BlobDriver {
  private basePath: string

  constructor(basePath: string) {
    super()
    this.basePath = basePath
    fs.mkdirSync(basePath, { recursive: true })
  }

  async list(prefix = ''): Promise<FileAttributes[]> {
    const dir = path.join(this.basePath, prefix)
    if (!fs.existsSync(dir)) return []

    const files: FileAttributes[] = []
    const walk = (currentDir: string, currentPrefix: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name)
        const fullPrefix = path.join(currentPrefix, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath, fullPrefix)
        } else {
          const stat = fs.statSync(fullPath)
          files.push({
            key: fullPrefix,
            size: stat.size,
            modified: stat.mtime,
          })
        }
      }
    }

    walk(dir, prefix)
    return files
  }

  async get(key: string): Promise<Readable> {
    const filePath = path.join(this.basePath, key)
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`)
    }
    return fs.createReadStream(filePath)
  }

  async put(key: string, content: Readable | Buffer | string, size?: number): Promise<void> {
    const filePath = path.join(this.basePath, key)
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir, { recursive: true })

    if (Buffer.isBuffer(content)) {
      fs.writeFileSync(filePath, content)
    } else if (typeof content === 'string') {
      fs.writeFileSync(filePath, content)
    } else {
      const writeStream = fs.createWriteStream(filePath)
      await new Promise<void>((resolve, reject) => {
        content.pipe(writeStream)
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
      })
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key)
    return fs.existsSync(filePath)
  }

  async url(key: string): Promise<string> {
    return path.join(this.basePath, key)
  }
}
