# TspoonBase

A TypeScript backend-as-a-service with SQLite, authentication, realtime subscriptions, file storage, AI-powered development tools, and an extensible hook system. Inspired by PocketBase.

## Architecture

```
src/
├── pocketbase.ts          # Main entry point (TspoonBase class)
├── cli.ts                 # CLI commands (serve, superuser)
├── core/                  # Core application layer
│   ├── base.ts            # BaseApp - main app interface with hooks, DB, settings
│   ├── db.ts              # SQLite dual-database (data.db + auxiliary.db)
│   ├── model.ts           # BaseModel with isNew/markAsNew
│   ├── collection.ts      # Collection model (base, auth, view types)
│   ├── record.ts          # Record model with field accessors
│   ├── field.ts           # All field types (text, number, email, bool, date, select, file, relation, json, editor, autodate, geoPoint)
│   ├── settings.ts        # AppSettings with SMTP, S3, rate limits, backups, AI config
│   ├── events.ts          # Event type definitions
│   ├── record_query.ts    # Record query methods (findById, filter, count, etc.)
│   ├── record_field_resolver.ts # @request.* macro resolver with modifiers
│   ├── record_upsert.ts   # Record validation and upsert form
│   ├── schema_sync.ts     # Collection schema synchronization
│   ├── settings_encrypt.ts # Settings encryption for sensitive values
│   ├── auth_models.ts     # MFA, OTP, AuthOrigin, ExternalAuth models
│   └── auth_queries.ts    # Auth-related DB queries
├── ai/                    # AI Development Tools
│   ├── provider.ts        # LLM provider abstraction (OpenAI, Anthropic, Ollama)
│   └── service.ts         # AI schema generator, rule translator, data seeder
├── apis/                  # REST API layer
│   ├── serve.ts           # Express server setup with middleware stack
│   ├── record_auth.ts     # Auth endpoints (login, OAuth2, OTP, refresh, methods)
│   ├── record_crud.ts     # Record CRUD (list, get, create, update, delete)
│   ├── record_helpers.ts  # Record enrichment, expansion, access rules
│   ├── collection.ts      # Collection CRUD + import/export
│   ├── settings.ts        # Settings CRUD + SMTP/S3 test
│   ├── realtime.ts        # SSE + WebSocket realtime subscriptions
│   ├── file.ts            # File upload, serving, thumbnails
│   ├── batch.ts           # Batch API with transaction support
│   ├── auth_flows.ts      # Password reset, email verification, email change
│   ├── admin_auth.ts      # Admin/superuser login endpoint
│   ├── ai.ts              # AI generation endpoints
│   ├── cron.ts            # Cron job management
│   ├── backup.ts          # Backup CRUD + restore
│   ├── logs.ts            # Log listing + stats
│   ├── health.ts          # Health check
│   ├── installer.ts       # First-run installer
│   └── middlewares_*.ts   # CORS, gzip, rate limit, body limit, auth
├── tools/                 # Utilities
│   ├── auth/              # OAuth2 providers (GitHub, Google, Discord, Facebook + extensible)
│   ├── security/          # JWT, bcrypt, encryption, random generation
│   ├── types/             # DateTime, GeoPoint, JSONArray, JSONMap, JSONRaw
│   ├── hook/              # Hook & TaggedHook event system
│   ├── store/             # Runtime key-value store
│   ├── subscriptions/     # Realtime subscription broker
│   ├── cron/              # Cron scheduler
│   ├── mailer/            # SMTP/Sendmail mailer + HTML-to-text + templates
│   ├── filesystem/        # Local + S3 blob storage
│   ├── search/            # Filter parser + SQL builder
│   ├── logger/            # Structured logger
│   ├── template/          # Email template registry
│   ├── list/              # Array utilities
│   ├── inflector/         # String transformations
│   ├── picker/            # Object pick/omit/excerpt
│   ├── osutils/           # Directory utilities
│   └── routine/           # Background task runner
├── validators/            # Field validators
├── migrations/            # Database migrations
└── cmd/                   # CLI commands
    └── superuser.ts       # Superuser creation command
```

## Quick Start

### Install globally

```bash
npm install -g tspoonbase
```

### Run the server

```bash
# Development mode
tspoonbase serve --dev --port 8090

# Production mode
tspoonbase serve --port 8090

# Create superuser
tspoonbase superuser-create admin@example.com secret123
```

### Use as a library

```bash
npm install tspoonbase
```

```typescript
import { TspoonBase, Collection, RecordModel } from 'tspoonbase'

const app = new TspoonBase({ defaultDev: true })
await app.start(8090)
```

## API Examples

### Health Check
```bash
curl http://localhost:8090/api/health
```

### Create a collection
```bash
curl -X POST http://localhost:8090/api/collections \
  -H "Content-Type: application/json" \
  -d '{"name":"posts","type":"base","fields":[{"name":"title","type":"text","required":true},{"name":"body","type":"editor"},{"name":"published","type":"bool"}]}'
```

### List collections
```bash
curl http://localhost:8090/api/collections
```

### Create a record
```bash
curl -X POST http://localhost:8090/api/collections/posts/records \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","body":"<p>My post</p>","published":true}'
```

### List records with filter and sort
```bash
curl "http://localhost:8090/api/collections/posts/records?filter=published=true&sort=-created"
```

### Register & login
```bash
# Create auth collection
curl -X POST http://localhost:8090/api/collections \
  -H "Content-Type: application/json" \
  -d '{"name":"users","type":"auth","fields":[{"name":"name","type":"text"}]}'

# Register
curl -X POST http://localhost:8090/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123","name":"Test"}'

# Login
curl -X POST http://localhost:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"test@example.com","password":"secret123"}'
```

### Admin login
```bash
curl -X POST http://localhost:8090/api/admins/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@example.com","password":"secret123"}'
```

## AI Development Tools

TspoonBase includes AI-powered tools to accelerate backend development. Configure AI in settings:

```bash
curl -X PATCH http://localhost:8090/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"ai":{"enabled":true,"provider":"openai","apiKey":"sk-...","model":"gpt-4o-mini"}}'
```

### AI Schema Generator
Generate collection schemas from natural language descriptions:

```bash
curl -X POST http://localhost:8090/api/ai/generate-collection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"description":"A blog post with title, content, published date, tags, and an author relation to users"}'
```

### AI Access Rule Generator
Convert plain English security requirements into filter expressions:

```bash
curl -X POST http://localhost:8090/api/ai/generate-rule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"action":"update","description":"Only the record owner can update, owner field is called user"}'
```

### AI Data Seeder
Generate realistic seed data:

```bash
curl -X POST http://localhost:8090/api/ai/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"collectionName":"products","count":10,"constraints":"Tech gadgets, prices between $10-$500"}'
```

### AI Admin Assistant
Open `http://localhost:8090/_/ai` in your browser for a chat interface to:
- Generate collections from descriptions
- Write access rules in plain English
- Get help with filter syntax
- Explore your database schema

### AI Chat API
```bash
curl -X POST http://localhost:8090/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"message":"What collections do I have?"}'
```

### Supported LLM Providers
- **OpenAI** (GPT-4, GPT-4o-mini, etc.)
- **Anthropic** (Claude 3, etc.)
- **Ollama** (local models like Llama, Mistral)
- **Custom** (any OpenAI-compatible API)

## Password reset
```bash
# Request reset
curl -X POST http://localhost:8090/api/collections/users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Confirm reset
curl -X POST http://localhost:8090/api/collections/users/confirm-password-reset \
  -H "Content-Type: application/json" \
  -d '{"token":"RESET_TOKEN","password":"newpass123","passwordConfirm":"newpass123"}'
```

### Email verification
```bash
# Request verification
curl -X POST http://localhost:8090/api/collections/users/request-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Confirm verification
curl -X POST http://localhost:8090/api/collections/users/confirm-verification \
  -H "Content-Type: application/json" \
  -d '{"token":"VERIFY_TOKEN"}'
```

### Batch API
```bash
curl -X POST http://localhost:8090/api/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AUTH_TOKEN" \
  -d '{
    "requests": [
      { "method": "GET", "url": "/api/collections/posts/records" },
      { "method": "POST", "url": "/api/collections/posts/records", "body": {"title":"Batch"} }
    ]
  }'
```

### Realtime WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8090/api/realtime')
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['collections.posts.records']
  }))
}
ws.onmessage = (e) => console.log(JSON.parse(e.data))
```

### Settings
```bash
# Get settings (superuser required)
curl http://localhost:8090/api/settings \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update settings
curl -X PATCH http://localhost:8090/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"appName":"My App","smtp":{"host":"smtp.example.com","port":587}}'
```

## Feature Comparison

| Feature | Go PocketBase | TspoonBase |
|---------|--------------|------------|
| Runtime | Go 1.21+ | Node.js 20+ |
| Database | SQLite via modernc/sqlite | SQLite via better-sqlite3 |
| HTTP Server | net/http | Express.js |
| Auth | Email/password, OAuth2, OTP | Email/password, OAuth2, OTP (stub) |
| Realtime | SSE + WebSocket | SSE + WebSocket |
| File Storage | Local + S3 | Local + S3 (with thumbnails) |
| AI Tools | ❌ | ✅ Schema gen, rule gen, data seeder |
| Admin UI | Embedded SPA | Basic + AI Assistant |
| JSVM | Goja | Not included |
| Batch API | Yes | Yes (with transactions) |
| Settings Encryption | Yes | Yes |
| Email Templates | Yes | Yes |
| Schema Sync | Yes | Yes |
| Record Expansion | Yes | Yes |
| Filter/Sort/Pagination | Yes | Yes |
| Access Rules | Yes | Yes |
| MFA/OTP Models | Yes | Yes |

## What's Implemented

- [x] Core App interface with hook system
- [x] Dual SQLite databases (data.db + auxiliary.db)
- [x] All 13 field types with validation
- [x] Collection CRUD (base, auth, view) + schema sync
- [x] Record CRUD with pagination, filtering, sorting, expansion
- [x] Authentication (email/password, JWT tokens, refresh)
- [x] OAuth2 provider framework (GitHub, Google, Discord, Facebook + extensible)
- [x] Password reset, email verification, email change flows
- [x] Settings management with encryption for sensitive fields
- [x] Realtime SSE + WebSocket subscriptions with broker
- [x] File upload, serving, and thumbnail generation
- [x] Batch API with transaction support
- [x] Backup management
- [x] Log listing and stats
- [x] Cron job management
- [x] Health check
- [x] First-run installer with console banner
- [x] CLI (serve, superuser-create)
- [x] Migration system
- [x] Security utilities (JWT, bcrypt, AES encryption, random)
- [x] Hook/event system with tagging
- [x] Email templates (verification, password reset, email change, OTP)
- [x] Record upsert form with validation
- [x] Record field resolver with `@request.*` macros and modifiers
- [x] **AI Schema Generator** - Generate collections from natural language
- [x] **AI Rule Generator** - Convert English to PocketBase filter expressions
- [x] **AI Data Seeder** - Generate realistic seed data via LLM
- [x] **AI Admin Assistant** - Browser chat UI at `/_/ai`
- [x] **Multi-provider LLM support** (OpenAI, Anthropic, Ollama, Custom)

## What's Not Yet Implemented

- [ ] Full Admin UI (React/Vite frontend)
- [ ] Full OAuth2 redirect handling (callback URL configuration)
- [ ] OTP authentication (models exist, endpoint stub)
- [ ] MFA/TOTP support (models exist)
- [ ] S3 file storage (local works, S3 is stubbed)
- [ ] JSVM (JavaScript hooks)
- [ ] View collections (SQL views)
- [ ] Advanced database migrations
- [ ] Rate limiting middleware enforcement

## License

MIT
