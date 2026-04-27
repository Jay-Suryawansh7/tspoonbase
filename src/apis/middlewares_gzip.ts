import { Request, Response, NextFunction } from 'express'
import zlib from 'zlib'
import { Transform } from 'stream'

export function gzipMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const accept = req.headers['accept-encoding'] || ''
    if (!accept.includes('gzip')) {
      return next()
    }

    const gzip = zlib.createGzip()
    
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')

    gzip.on('data', (chunk: Buffer) => {
      if (!res.writableEnded) {
        res.write(chunk)
      }
    })

    gzip.on('end', () => {
      if (!res.writableEnded) {
        res.end()
      }
    })

    gzip.on('error', (err) => {
      console.error('Gzip error:', err)
      if (!res.writableEnded) {
        res.end()
      }
    })

    const originalWrite = res.write.bind(res)
    res.write = (chunk: any, encoding?: any): boolean => {
      if (!res.writableEnded) {
        gzip.write(chunk, encoding)
      }
      return true
    }

    const originalEnd = res.end.bind(res)
    res.end = (chunk?: any, encoding?: any): Response => {
      if (chunk) gzip.write(chunk, encoding)
      gzip.end()
      return res
    }

    next()
  }
}