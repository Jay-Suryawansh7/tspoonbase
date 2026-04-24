export class TemplateRenderer {
  private templates: Map<string, string> = new Map()

  register(name: string, template: string): void {
    this.templates.set(name, template)
  }

  render(name: string, data: Record<string, any>): string {
    const template = this.templates.get(name)
    if (!template) {
      throw new Error(`Template "${name}" not found`)
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : ''
    })
  }

  renderString(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : ''
    })
  }
}

export const defaultTemplates = new TemplateRenderer()

defaultTemplates.register('verification', `
<h2>Verify your email</h2>
<p>Hi {{name}},</p>
<p>Click the link below to verify your email address:</p>
<p><a href="{{appURL}}/auth/confirm-verification?token={{token}}">Verify Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
`)

defaultTemplates.register('passwordReset', `
<h2>Reset your password</h2>
<p>Hi {{name}},</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{appURL}}/auth/confirm-password-reset?token={{token}}">Reset Password</a></p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
`)

defaultTemplates.register('emailChange', `
<h2>Confirm email change</h2>
<p>Hi {{name}},</p>
<p>Click the link below to confirm your new email address:</p>
<p><a href="{{appURL}}/auth/confirm-email-change?token={{token}}">Confirm Email Change</a></p>
<p>If you didn't request this change, you can safely ignore this email.</p>
`)

defaultTemplates.register('otp', `
<h2>Your OTP code</h2>
<p>Hi {{name}},</p>
<p>Your one-time password is:</p>
<h1>{{otp}}</h1>
<p>This code will expire in {{expiry}} minutes.</p>
`)
