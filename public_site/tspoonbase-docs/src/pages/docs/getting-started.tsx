import { useState } from 'react'
import DocSection from '../../components/DocSection'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import { Info } from 'lucide-react'

const quickStartTabs = [
  {
    id: 'global-cli',
    label: 'Global CLI',
    code: `# Install globally
npm install -g tspoonbase

# Create a new project
tspoonbase init my-backend
cd my-backend

# Start the dev server
tspoonbase serve --dev --port 8090`,
    lang: 'bash' as const,
  },
  {
    id: 'programmatic',
    label: 'Programmatic',
    code: `import { createServer } from 'tspoonbase'

const app = createServer({
  port: 8090,
  dataDir: './pb_data',
  dev: true,
})

app.start().then(() => {
  console.log('Server running at http://localhost:8090')
})`,
    lang: 'typescript' as const,
  },
  {
    id: 'docker',
    label: 'Docker',
    code: `# Pull the image
docker pull tspoonbase/tspoonbase:latest

# Run with volume mount
docker run -p 8090:8090 \\
  -v $(pwd)/pb_data:/app/pb_data \\
  tspoonbase/tspoonbase:latest`,
    lang: 'bash' as const,
  },
]

export default function GettingStarted() {
  const [activeTab, setActiveTab] = useState(quickStartTabs[0].id)
  const active = quickStartTabs.find((t) => t.id === activeTab)!

  return (
    <article>
      <h1 className="mb-8 font-heading text-4xl font-bold text-theme">Getting Started</h1>

      <DocSection id="quick-start" title="Quick Start">
        <p className="mb-6 text-theme-secondary">
          Choose your preferred way to run TspoonBase. All three methods give you the same
          fully-featured backend.
        </p>

        <div className="mb-4 flex items-center gap-1 rounded-lg border border-theme bg-theme-surface p-1">
          {quickStartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-theme-tertiary hover:text-theme-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CodeBlock
          key={active.id}
          code={active.code}
          lang={active.lang}
          filename={active.id === 'docker' ? 'terminal' : active.id === 'programmatic' ? 'server.ts' : 'terminal'}
        />
      </DocSection>

      <DocSection id="installation" title="Installation">
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-theme-secondary">
            <strong className="text-theme">Requirements:</strong> Node.js{' '}
            <code className="rounded bg-theme-muted px-1 py-0.5 text-xs text-primary">{'>= 20.0.0'}</code>
            . TspoonBase is tested on Node 20, 22, and the latest LTS.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-theme">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-theme bg-theme-surface">
                <th className="px-5 py-3 font-heading font-semibold text-theme-tertiary">Method</th>
                <th className="px-5 py-3 font-heading font-semibold text-theme-tertiary">Command</th>
              </tr>
            </thead>
            <tbody>
              {[
                { method: 'npm (global)', cmd: 'npm install -g tspoonbase' },
                { method: 'yarn (global)', cmd: 'yarn global add tspoonbase' },
                { method: 'pnpm (global)', cmd: 'pnpm add -g tspoonbase' },
                { method: 'npx (no install)', cmd: 'npx tspoonbase serve --dev' },
                { method: 'Docker', cmd: 'docker pull tspoonbase/tspoonbase:latest' },
              ].map((row, idx) => (
                <tr
                  key={row.method}
                  className={`transition-colors hover:bg-theme-muted ${
                    idx !== 4 ? 'border-b border-theme' : ''
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-theme-secondary">{row.method}</td>
                  <td className="px-5 py-3">
                    <code className="rounded bg-theme-surface px-2 py-1 text-xs text-theme-secondary">{row.cmd}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <MermaidDiagram
        caption="Typical project structure"
        children={`flowchart TD
    A[my-project/] --> B[pb_data/]
    A --> C[pb_migrations/]
    A --> D[pb_hooks/]
    A --> E[src/]
    B --> B1[data.db]
    B --> B2[auxiliary.db]
    C --> C1[001_init.js]
    C --> C2[002_seed.js]
    D --> D1[onBootstrap.js]
    D --> D2[onRecordCreate.js]
    E --> E1[server.ts]
    style A fill:#1a6fff,color:#fff
    style B fill:#1a6fff,color:#fff
    style C fill:#1a6fff,color:#fff`}
      />

      <DocSection id="cli-commands" title="CLI Commands">
        <p className="mb-6 text-theme-secondary">
          TspoonBase ships with a powerful CLI for scaffolding, serving, and managing your backend.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-heading text-base font-semibold text-theme">
              tspoonbase serve
            </h3>
            <p className="mb-3 text-sm text-theme-tertiary">
              Start the TspoonBase server. Use <code className="rounded bg-theme-muted px-1 py-0.5 text-xs text-primary">--dev</code> for development with hot reload and verbose logging.
            </p>
            <CodeBlock
              lang="bash"
              code={`# Development mode with hot reload
tspoonbase serve --dev --port 8090 --dir ./pb_data

# Production mode
tspoonbase serve --port 8090 --dir ./pb_data`}
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { flag: '--port', desc: 'Server port (default: 8090)' },
                { flag: '--dev', desc: 'Enable dev mode + hot reload' },
                { flag: '--dir', desc: 'Data directory path' },
              ].map((f) => (
                <div key={f.flag} className="rounded-lg border border-theme bg-theme-surface px-3 py-2">
                  <code className="text-xs text-primary">{f.flag}</code>
                  <p className="mt-0.5 text-xs text-theme-tertiary">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-heading text-base font-semibold text-theme">
              tspoonbase superuser-create
            </h3>
            <p className="mb-3 text-sm text-theme-tertiary">
              Create the first admin superuser account interactively. You need this to access the Admin UI.
            </p>
            <CodeBlock
              lang="bash"
              code={`tspoonbase superuser-create
# ? Email: admin@example.com
# ? Password: ********
# ✓ Superuser created successfully`}
            />
          </div>

          <div>
            <h3 className="mb-2 font-heading text-base font-semibold text-theme">
              tspoonbase migrate
            </h3>
            <p className="mb-3 text-sm text-theme-tertiary">
              Manage database migrations. TspoonBase auto-generates migration files from your collection changes.
            </p>
            <CodeBlock
              lang="bash"
              code={`# Run all pending migrations
tspoonbase migrate up

# Rollback the last migration
tspoonbase migrate down

# Check migration status
tspoonbase migrate status`}
            />
          </div>
        </div>
      </DocSection>

      <DocSection id="first-steps" title="First Steps">
        <p className="mb-6 text-theme-secondary">
          Follow this guide to get from zero to a working backend in under 5 minutes.
        </p>

        <MermaidDiagram
          caption="Project setup workflow"
          children={`flowchart LR
    A[Install CLI] --> B[Init Project]
    B --> C[Start Server]
    C --> D[Create Superuser]
    D --> E[Open Admin UI]
    E --> F[Define Collections]
    F --> G[Build Frontend]
    style A fill:#1a6fff,color:#fff
    style G fill:#1a6fff,color:#fff`}
        />

        <ol className="space-y-6">
          {[
            {
              title: 'Install TspoonBase globally',
              body: 'Install the CLI tool so you can run it from anywhere.',
              code: 'npm install -g tspoonbase',
              lang: 'bash' as const,
            },
            {
              title: 'Start the server',
              body: 'Run the dev server. It will create a pb_data/ directory automatically.',
              code: 'tspoonbase serve --dev --port 8090',
              lang: 'bash' as const,
            },
            {
              title: 'Create a superuser',
              body: 'Visit the Admin UI at http://localhost:8090/_/ to create your first admin account directly in the browser. Alternatively, use the CLI:',
              code: 'tspoonbase superuser-create admin@example.com secret123',
              lang: 'bash' as const,
            },
            {
              title: 'Open the Admin UI',
              body: 'Visit the admin panel to manage collections, users, and settings.',
              code: 'http://localhost:8090/_/',
              lang: 'bash' as const,
            },
            {
              title: 'Create your first collection',
              body: 'Use the Admin UI or CLI to define a collection schema. Here is a posts collection example:',
              code: `import { defineCollection } from 'tspoonbase'

export default defineCollection({
  name: 'posts',
  schema: [
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'text' },
    { name: 'published', type: 'bool', default: false },
  ],
})`,
              lang: 'typescript' as const,
            },
          ].map((step, idx) => (
            <li key={idx} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </span>
              <div className="flex-1">
                <h3 className="mb-1 font-heading text-base font-semibold text-theme">
                  {step.title}
                </h3>
                <p className="mb-3 text-sm text-theme-tertiary">{step.body}</p>
                <CodeBlock lang={step.lang} code={step.code} />
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-theme-secondary">
            <strong className="text-theme">Tip:</strong> Run with the{' '}
            <code className="rounded bg-theme-muted px-1 py-0.5 text-xs text-primary">--dev</code>{' '}
            flag in development for hot reload and verbose logging. It watches your
            collection files and restarts the server automatically on changes.
          </p>
        </div>
      </DocSection>

      <DocSection id="project-structure" title="Project Structure">
        <p className="mb-6 text-theme-secondary">
          TspoonBase follows a convention-over-configuration approach. These directories are
          created automatically on first run:
        </p>

        <CodeBlock
          lang="bash"
          code={`my-backend/
├── pb_data/           # SQLite database + uploaded files
│   ├── data.db
│   └── storage/
├── pb_public/         # Static files served at /
│   └── index.html
├── pb_migrations/     # Auto-generated migration files
│   └── 001_init.js
├── pb_hooks/          # JavaScript hook files
│   └── onRecordCreate.js
├── collections/       # Collection schema definitions
│   └── posts.ts
└── tspoonbase.config.ts`}
        />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              dir: 'pb_data/',
              desc: 'SQLite database, logs, and uploaded file storage. Safe to backup as a single folder.',
            },
            {
              dir: 'pb_public/',
              desc: 'Static assets served from the root path. Place your SPA build output here.',
            },
            {
              dir: 'pb_migrations/',
              desc: 'Timestamped migration files. TspoonBase auto-generates these when you change schemas.',
            },
            {
              dir: 'pb_hooks/',
              desc: 'Server-side JavaScript hooks for extending behavior (auth, CRUD events, etc).',
            },
            {
              dir: 'collections/',
              desc: 'TypeScript schema definitions for your collections. Exported from the Admin UI.',
            },
            {
              dir: 'tspoonbase.config.ts',
              desc: 'Main configuration file: port, database path, CORS, email settings, and more.',
            },
          ].map((item) => (
            <div
              key={item.dir}
              className="rounded-lg border border-theme bg-theme-surface px-4 py-3"
            >
              <code className="text-xs text-primary">{item.dir}</code>
              <p className="mt-1 text-xs leading-relaxed text-theme-tertiary">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="changelog" title="Changelog">
        <div className="space-y-6">
          <div className="rounded-lg border border-theme bg-theme-surface p-4">
            <h3 className="font-heading text-lg font-bold text-theme">v0.5.2</h3>
            <p className="mt-1 text-xs text-theme-muted">2026-05-01</p>
            <h4 className="mt-3 text-sm font-semibold text-green-400">Fixed</h4>
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-theme-secondary">
              <li>Implemented backup create, restore, and upload endpoints (were non-functional stubs)</li>
              <li>Backups now include both databases (data.db + auxiliary.db) and storage files in a zip</li>
              <li>Restore safely checkpoints WAL, replaces files, and re-bootstraps the server</li>
            </ul>
          </div>
          <div className="rounded-lg border border-theme bg-theme-surface p-4">
            <h3 className="font-heading text-lg font-bold text-theme">v0.5.1</h3>
            <p className="mt-1 text-xs text-theme-muted">2026-05-01</p>
            <h4 className="mt-3 text-sm font-semibold text-green-400">Fixed</h4>
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-theme-secondary">
              <li>Removed circular self-dependency (tspoonbase depending on itself in package.json)</li>
              <li>Synced hardcoded version in src to match package.json</li>
            </ul>
          </div>

          <div className="rounded-lg border border-theme bg-theme-surface p-4">
            <h3 className="font-heading text-lg font-bold text-theme">v0.5.0</h3>
            <p className="mt-1 text-xs text-theme-muted">2026-04-29</p>
            <h4 className="mt-3 text-sm font-semibold text-blue-400">Added</h4>
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-theme-secondary">
              <li>FAQ and Privacy Policy pages on docs site and landing page</li>
              <li>Feedback form page</li>
              <li>Projects page with project guides</li>
              <li>Knowledge graph visualizations in documentation</li>
            </ul>
          </div>
        </div>
      </DocSection>
    </article>
  )
}
