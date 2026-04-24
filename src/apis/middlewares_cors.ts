import { Request, Response, NextFunction } from 'express'
import cors from 'cors'

export function corsMiddleware() {
  return cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Total-Count', 'Link'],
    maxAge: 3600,
  })
}
