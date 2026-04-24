import { Mailer, MailMessage } from './mailer'
import { AppSettings } from '../../core/settings'

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class EmailTemplateEngine {
  private settings: AppSettings

  constructor(settings: AppSettings) {
    this.settings = settings
  }

  render(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`
    })
  }

  getVerificationTemplate(): EmailTemplate {
    const appName = this.settings.appName
    const appURL = this.settings.appURL

    return {
      subject: `Verify your email for ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Thank you for signing up with ${appName}. Please verify your email address by clicking the link below:</p>
          <p><a href="{{verificationURL}}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>{{verificationURL}}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
      text: `Verify Your Email\n\nThank you for signing up with ${appName}. Please verify your email address by visiting:\n\n{{verificationURL}}\n\nIf you didn't create an account, you can safely ignore this email.`,
    }
  }

  getPasswordResetTemplate(): EmailTemplate {
    const appName = this.settings.appName

    return {
      subject: `Password reset for ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset for your ${appName} account. Click the link below to reset your password:</p>
          <p><a href="{{resetURL}}" style="display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>{{resetURL}}</p>
          <p>This link will expire in 1 hour.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
      text: `Password Reset\n\nYou requested a password reset for your ${appName} account. Visit:\n\n{{resetURL}}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
    }
  }

  getEmailChangeTemplate(): EmailTemplate {
    const appName = this.settings.appName

    return {
      subject: `Confirm email change for ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Confirm Email Change</h2>
          <p>You requested to change your email address for your ${appName} account. Click the link below to confirm:</p>
          <p><a href="{{confirmationURL}}" style="display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px;">Confirm Email Change</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>{{confirmationURL}}</p>
          <p>This link will expire in 2 hours.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you didn't request an email change, you can safely ignore this email.</p>
        </div>
      `,
      text: `Confirm Email Change\n\nYou requested to change your email address for your ${appName} account. Visit:\n\n{{confirmationURL}}\n\nThis link will expire in 2 hours.\n\nIf you didn't request an email change, you can safely ignore this email.`,
    }
  }

  getOTPLoginTemplate(): EmailTemplate {
    const appName = this.settings.appName

    return {
      subject: `Your login code for ${appName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login Code</h2>
          <p>Your one-time login code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 16px; background: #f8f9fa; border-radius: 4px; text-align: center;">{{otp}}</p>
          <p>This code will expire in 15 minutes.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
      text: `Login Code\n\nYour one-time login code is: {{otp}}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
    }
  }
}

export async function sendVerificationEmail(
  mailer: Mailer,
  engine: EmailTemplateEngine,
  to: string,
  variables: { verificationURL: string; userName?: string }
): Promise<void> {
  const template = engine.getVerificationTemplate()
  const subject = engine.render(template.subject, variables)
  const html = engine.render(template.html, variables)
  const text = template.text ? engine.render(template.text, variables) : undefined

  await mailer.send({
    from: `${engine['settings'].senderName || engine['settings'].appName} <${engine['settings'].senderAddress}>`,
    to,
    subject,
    html,
    text,
  })
}

export async function sendPasswordResetEmail(
  mailer: Mailer,
  engine: EmailTemplateEngine,
  to: string,
  variables: { resetURL: string; userName?: string }
): Promise<void> {
  const template = engine.getPasswordResetTemplate()
  const subject = engine.render(template.subject, variables)
  const html = engine.render(template.html, variables)
  const text = template.text ? engine.render(template.text, variables) : undefined

  await mailer.send({
    from: `${engine['settings'].senderName || engine['settings'].appName} <${engine['settings'].senderAddress}>`,
    to,
    subject,
    html,
    text,
  })
}

export async function sendEmailChangeConfirmation(
  mailer: Mailer,
  engine: EmailTemplateEngine,
  to: string,
  variables: { confirmationURL: string; userName?: string }
): Promise<void> {
  const template = engine.getEmailChangeTemplate()
  const subject = engine.render(template.subject, variables)
  const html = engine.render(template.html, variables)
  const text = template.text ? engine.render(template.text, variables) : undefined

  await mailer.send({
    from: `${engine['settings'].senderName || engine['settings'].appName} <${engine['settings'].senderAddress}>`,
    to,
    subject,
    html,
    text,
  })
}

export async function sendOTPEmail(
  mailer: Mailer,
  engine: EmailTemplateEngine,
  to: string,
  variables: { otp: string }
): Promise<void> {
  const template = engine.getOTPLoginTemplate()
  const subject = engine.render(template.subject, variables)
  const html = engine.render(template.html, variables)
  const text = template.text ? engine.render(template.text, variables) : undefined

  await mailer.send({
    from: `${engine['settings'].senderName || engine['settings'].appName} <${engine['settings'].senderAddress}>`,
    to,
    subject,
    html,
    text,
  })
}
