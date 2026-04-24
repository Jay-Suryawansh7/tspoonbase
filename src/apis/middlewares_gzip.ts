import { Request, Response, NextFunction } from 'express'
import zlib from 'zlib'

export function gzipMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const accept = req.headers['accept-encoding'] || ''
    if (!accept.includes('gzip')) {
      return next()
    }

    const originalWrite = res.write.bind(res)
    const originalEnd = res.end.bind(res)

    const gzip = zlib.createGzip()

    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Vary', 'Accept-Encoding')

    gzip.pipe({
      write: (chunk: any, encoding: any, cb: any) => {
        originalWrite(chunk, encoding as any)
        cb()
      },
      end: (cb: any) => {
        originalEnd(cb)
      },
    } as any)

    res.write = (chunk: any, ...args: any[]) => {
      gzip.write(chunk, args[0], args[1])
      return true
    }

    res.end = (chunk: any, ...args: any[]) => {
      if (chunk) gzip.write(chunk)
      gzip.end()
      if (args[0]) args[0]()
      return res
    }

    next()
  }
}
