export interface AuthUser {
  id: string
  name: string
  email: string
  username?: string
  avatarUrl?: string
  rawUser: Record<string, any>
}

export interface AuthProvider {
  name: string
  displayName: string
  authUrl: string
  tokenUrl: string
  userUrl: string
  clientId: string
  clientSecret: string
  scopes: string[]

  getAuthUrl(state: string, codeVerifier?: string): string
  exchangeCode(code: string, codeVerifier?: string, redirectURL?: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>
  fetchUser(accessToken: string): Promise<AuthUser>
  fetchRawUser(accessToken: string): Promise<Record<string, any>>
}

export abstract class BaseProvider implements AuthProvider {
  name: string
  displayName: string
  authUrl: string
  tokenUrl: string
  userUrl: string
  clientId: string
  clientSecret: string
  scopes: string[]

  constructor(config: {
    name: string
    displayName: string
    authUrl: string
    tokenUrl: string
    userUrl: string
    clientId: string
    clientSecret: string
    scopes: string[]
  }) {
    this.name = config.name
    this.displayName = config.displayName
    this.authUrl = config.authUrl
    this.tokenUrl = config.tokenUrl
    this.userUrl = config.userUrl
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.scopes = config.scopes
  }

  getAuthUrl(state: string, codeVerifier?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: '',
      response_type: 'code',
      state,
      scope: this.scopes.join(' '),
    })

    if (codeVerifier) {
      params.set('code_challenge', codeVerifier)
      params.set('code_challenge_method', 'S256')
    }

    return `${this.authUrl}?${params.toString()}`
  }

  async exchangeCode(code: string, codeVerifier?: string, redirectURL?: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectURL ?? '',
    })

    if (codeVerifier) {
      body.set('code_verifier', codeVerifier)
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    const data = await response.json() as { access_token: string; refresh_token?: string; expires_in?: number }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  abstract fetchUser(accessToken: string): Promise<AuthUser>

  async fetchRawUser(accessToken: string): Promise<Record<string, any>> {
    const response = await fetch(this.userUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`)
    }

    return response.json() as Promise<Record<string, any>>
  }
}

export class GitHubProvider extends BaseProvider {
  constructor(clientId: string, clientSecret: string) {
    super({
      name: 'github',
      displayName: 'GitHub',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userUrl: 'https://api.github.com/user',
      clientId,
      clientSecret,
      scopes: ['user:email'],
    })
  }

  async fetchUser(accessToken: string): Promise<AuthUser> {
    const rawUser = await this.fetchRawUser(accessToken) as Record<string, any>
    const emails = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(r => r.json()) as Array<{ email: string; primary: boolean }>

    const primaryEmail = emails.find((e: { email: string; primary: boolean }) => e.primary)?.email ?? emails[0]?.email

    return {
      id: String(rawUser.id),
      name: rawUser.name ?? rawUser.login,
      email: primaryEmail,
      username: rawUser.login,
      avatarUrl: rawUser.avatar_url,
      rawUser,
    }
  }
}

export class GoogleProvider extends BaseProvider {
  constructor(clientId: string, clientSecret: string) {
    super({
      name: 'google',
      displayName: 'Google',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId,
      clientSecret,
      scopes: ['email', 'profile'],
    })
  }

  async fetchUser(accessToken: string): Promise<AuthUser> {
    const rawUser = await this.fetchRawUser(accessToken) as Record<string, any>
    return {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      username: rawUser.email?.split('@')[0],
      avatarUrl: rawUser.picture,
      rawUser,
    }
  }
}

export class AppleProvider extends BaseProvider {
  constructor(clientId: string, clientSecret: string) {
    super({
      name: 'apple',
      displayName: 'Apple',
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      userUrl: '',
      clientId,
      clientSecret,
      scopes: ['email', 'name'],
    })
  }

  async fetchUser(accessToken: string): Promise<AuthUser> {
    throw new Error('Apple user fetching requires ID token parsing')
  }
}
