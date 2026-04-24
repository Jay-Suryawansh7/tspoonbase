const API_BASE = ''

class ApiClient {
  private token = ''

  setToken(token: string) {
    this.token = token
  }

  private async request(method: string, path: string, body?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || `HTTP ${res.status}`)
    }

    if (res.status === 204) return null
    return res.json()
  }

  get(path: string) { return this.request('GET', path) }
  post(path: string, body?: any) { return this.request('POST', path, body) }
  patch(path: string, body?: any) { return this.request('PATCH', path, body) }
  delete(path: string) { return this.request('DELETE', path) }
}

export const api = new ApiClient()
