import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { BaseApp } from '../core/base'

export function rateLimitMiddleware(app: BaseApp) {
  const settings = app.settings()

  if (!settings.rateLimits.enabled) {
    return (req: Request, res: Response, next: NextFunction) => next()
  }

  // Use configured rules if available, otherwise fallback to defaults
  const rules = settings.rateLimits.rules
  const windowMs = rules && rules.length > 0 ? rules[0].duration * 1000 : 60 * 1000
  const maxRequests = rules && rules.length > 0 ? rules[0].requests : 1000

  // Create a key generator that includes user identity when available
  const keyGenerator = (req: Request): string => {
    const authId = req.authContext?.record?.id || req.authContext?.isAdmin ? 'admin' : ''
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    return authId ? `${ip}:${authId}` : ip
  }

  // Skip successful auth requests from counting against limits
  const skipSuccessfulRequests = false

  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skipSuccessfulRequests,
    message: { code: 429, message: 'Too many requests, please try again later.' },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        code: 429,
        message: 'Too many requests, please try again later.',
        data: {
          retryAfter: Math.ceil(windowMs / 1000),
        },
      })
    },
  })
}
