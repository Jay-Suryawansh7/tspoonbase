import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { BaseApp } from '../core/base'
import { registerAuthRoutes } from './record_auth'
import { registerRecordCRUDRoutes } from './record_crud'
import { registerCollectionRoutes } from './collection'
import { registerSettingsRoutes } from './settings'
import { registerHealthRoutes } from './health'
import { registerRealtimeRoutes, setupWebSocketRealtime } from './realtime'
import { registerFileRoutes } from './file'
import { registerBatchRoutes } from './batch'
import { registerCronRoutes } from './cron'
import { registerBackupRoutes } from './backup'
import { registerLogRoutes } from './logs'
import { registerInstallerRoutes } from './installer'
import { registerAIRoutes } from './ai'
import { registerAdminAuthRoutes } from './admin_auth'
import { corsMiddleware } from './middlewares_cors'
import { gzipMiddleware } from './middlewares_gzip'
import { rateLimitMiddleware } from './middlewares_rate_limit'
import { bodyLimitMiddleware } from './middlewares_body_limit'
import { loadAuthToken } from './middlewares_auth'
import { registerPasswordResetRoutes, registerVerificationRoutes, registerEmailChangeRoutes, registerImpersonateRoutes } from './auth_flows'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { registerBuiltInProviders } from '../tools/auth/oauth2'
import path from 'path'
import fs from 'fs'
import { hasSuperuser } from '../cmd/superuser'

export async function serve(app: BaseApp, port: number): Promise<void> {
  // Register built-in OAuth2 providers
  registerBuiltInProviders()

  const server = express()

  server.use(helmet({ contentSecurityPolicy: false }))
  server.use(corsMiddleware())
  server.use(express.json({ limit: '50mb' }))
  server.use(express.urlencoded({ extended: true, limit: '50mb' }))
  server.use(gzipMiddleware())
  server.use(rateLimitMiddleware(app))
  server.use(bodyLimitMiddleware())
  server.use(loadAuthToken(app))

  // Serve static files from pb_public directory if it exists
  const publicDir = path.join(process.cwd(), 'pb_public')
  if (fs.existsSync(publicDir)) {
    server.use(express.static(publicDir))
  }

  registerHealthRoutes(app, server)
  registerInstallerRoutes(app, server)
  registerAdminAuthRoutes(app, server)
  registerAuthRoutes(app, server)
  registerPasswordResetRoutes(app, server)
  registerVerificationRoutes(app, server)
  registerEmailChangeRoutes(app, server)
  registerImpersonateRoutes(app, server)
  registerRecordCRUDRoutes(app, server)
  registerCollectionRoutes(app, server)
  registerSettingsRoutes(app, server)
  registerRealtimeRoutes(app, server)
  registerFileRoutes(app, server)
  registerBatchRoutes(app, server)
  registerCronRoutes(app, server)
  registerBackupRoutes(app, server)
  registerLogRoutes(app, server)
  registerAIRoutes(app, server)

  // Admin dashboard placeholder route - SPA shell that routes by hash
  server.get('/_/', (req, res) => {
    const installerUrl = `http://localhost:${port}/_/#/install`
    const hasAdmin = hasSuperuser(app)
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TspoonBase Admin</title>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            a { color: #0066cc; }
            code { background: #eee; padding: 2px 6px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>TspoonBase Admin</h1>
          ${hasAdmin ? `
            <div class="box">
              <p>Admin UI is not yet included in this build.</p>
              <p>You can manage your data using the REST API at <code>/api/</code></p>
              <p><a href="/_/ai">AI Assistant</a> - Generate schemas, rules, and data</p>
            </div>
          ` : `
            <div class="box">
              <p>No superuser found. Please complete the installation:</p>
              <p><a href="${installerUrl}">Open Installer</a></p>
              <p>Or run: <code>./tspoonbase superuser-create EMAIL PASS</code></p>
            </div>
          `}
        </body>
      </html>
    `)
  })

  // AI Assistant page (direct route, also reachable via /_/#/ai client-side)
  server.get('/_/ai', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TspoonBase AI Assistant</title>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            h1 { color: #333; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            .chat { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; height: 70vh; }
            .messages { flex: 1; overflow-y: auto; padding: 20px; }
            .message { margin-bottom: 16px; }
            .message.user { text-align: right; }
            .message.assistant { text-align: left; }
            .bubble { display: inline-block; padding: 12px 16px; border-radius: 16px; max-width: 80%; word-wrap: break-word; }
            .message.user .bubble { background: #0066cc; color: white; border-bottom-right-radius: 4px; }
            .message.assistant .bubble { background: #f0f0f0; color: #333; border-bottom-left-radius: 4px; }
            .input-area { border-top: 1px solid #eee; padding: 16px; display: flex; gap: 8px; }
            input[type="text"] { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 24px; font-size: 14px; outline: none; }
            input[type="text"]:focus { border-color: #0066cc; }
            button { padding: 12px 24px; background: #0066cc; color: white; border: none; border-radius: 24px; cursor: pointer; font-size: 14px; }
            button:hover { background: #0052a3; }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            .tools { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
            .tool-btn { padding: 8px 16px; background: white; border: 1px solid #ddd; border-radius: 20px; cursor: pointer; font-size: 13px; }
            .tool-btn:hover { border-color: #0066cc; color: #0066cc; }
            pre { background: #f5f5f5; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
            code { font-family: 'SF Mono', Monaco, monospace; }
            .error { color: #dc3545; }
            .loading { color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>TspoonBase AI Assistant</h1>
          <p class="subtitle">Generate collections, access rules, seed data, and get help.</p>

          <div class="tools">
            <button class="tool-btn" onclick="quickAsk('Generate a blog posts collection with tags and authors')">+ Blog Collection</button>
            <button class="tool-btn" onclick="quickAsk('Generate a products collection with categories and prices')">+ Product Collection</button>
            <button class="tool-btn" onclick="quickAsk('Generate a todo app with projects and tasks')">+ Todo App</button>
            <button class="tool-btn" onclick="quickAsk('Write a rule: only the record owner can update')">+ Owner Rule</button>
          </div>

          <div class="chat">
            <div class="messages" id="messages"></div>
            <div class="input-area">
              <input type="text" id="input" placeholder="Ask me anything... (e.g. 'Create a users collection with profile fields')" onkeydown="if(event.key==='Enter')send()">
              <button id="sendBtn" onclick="send()">Send</button>
            </div>
          </div>

          <script>
            const messages = document.getElementById('messages');
            const input = document.getElementById('input');
            const sendBtn = document.getElementById('sendBtn');

            function addMessage(role, html) {
              const div = document.createElement('div');
              div.className = 'message ' + role;
              div.innerHTML = '<div class="bubble">' + html + '</div>';
              messages.appendChild(div);
              messages.scrollTop = messages.scrollHeight;
            }

            function quickAsk(text) {
              input.value = text;
              send();
            }

            async function send() {
              const text = input.value.trim();
              if (!text) return;

              addMessage('user', escapeHtml(text));
              input.value = '';
              sendBtn.disabled = true;

              // Show loading
              const loadingId = 'loading-' + Date.now();
              addMessage('assistant', '<span class="loading" id="' + loadingId + '">Thinking...</span>');

              try {
                const res = await fetch('/api/ai/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: text })
                });
                const data = await res.json();

                // Remove loading
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.parentElement.innerHTML = formatReply(data.reply || data.message || 'No response');
              } catch (err) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.parentElement.innerHTML = '<span class="error">Error: ' + escapeHtml(err.message) + '</span>';
              }

              sendBtn.disabled = false;
            }

            function escapeHtml(text) {
              const div = document.createElement('div');
              div.textContent = text;
              return div.innerHTML;
            }

            function formatReply(text) {
              // Simple markdown-like formatting
              let html = escapeHtml(text);
              html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
              html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
              html = html.replace(/\n/g, '<br>');
              return html;
            }
          </script>
        </body>
      </html>
    `)
  })

  await app.onServe.trigger({ app, router: server })

  const httpServer = http.createServer(server)

  const wss = new WebSocketServer({ noServer: true })
  setupWebSocketRealtime(wss)

  httpServer.on('upgrade', (request, socket, head) => {
    if (request.url === '/api/realtime') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    }
  })

  httpServer.listen(port, () => {
    if (!app.isDev) {
      console.log(`Server listening on port ${port}`)
    }
  })
}
