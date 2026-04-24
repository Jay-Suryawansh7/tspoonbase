import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { BaseApp } from '../core/base'

export function rateLimitMiddleware(app: BaseApp) {
  const settings = app.settings()

  if (!settings.rateLimits.enabled) {
    return (req: Request, res: Response, next: NextFunction) => next()
  }

  return rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: 429, message: 'Too many requests, please try again later.' },
  })
}
