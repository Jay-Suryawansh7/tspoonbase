import nodemailer from 'nodemailer'
import { AppSettings } from '../../core/settings'

export interface MailerConfig {
  host: string
  port: number
  username: string
  password: string
  authMethod: 'login' | 'plain' | 'cram-md5' | 'none'
  tls: boolean
  localName: string
}

export interface MailMessage {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  bcc?: string
  cc?: string
  replyTo?: string
  attachments?: Array<{ filename: string; content: Buffer }>
}

export class Mailer {
  private config: MailerConfig
  private transporter: nodemailer.Transporter | null = null

  constructor(config: MailerConfig) {
    this.config = config
  }

  static fromSettings(settings: AppSettings): Mailer {
    return new Mailer(settings.smtp)
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.tls,
      auth: this.config.username ? {
        user: this.config.username,
        pass: this.config.password,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    })

    return this.transporter
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.config.host) {
      throw new Error('SMTP host not configured')
    }

    const transporter = this.getTransporter()
    await transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      bcc: message.bcc,
      cc: message.cc,
      replyTo: message.replyTo,
      attachments: message.attachments,
    })
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
