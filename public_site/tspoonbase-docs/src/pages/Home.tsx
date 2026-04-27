import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ArrowRight,
  Code,
  Database,
  Shield,
  Sparkles,
  Search,
  Radio,
  FolderOpen,
  Copy,
  Check,
  Zap,
  Lock,
  Server,
} from 'lucide-react'
import Terminal from '../components/Terminal'
import FeatureCard from '../components/FeatureCard'
import CodeBlock from '../components/CodeBlock'
import MermaidDiagram from '../components/MermaidDiagram'
import Footer from '../components/Footer'
import { useState } from 'react'

const features = [
  {
    icon: Database,
    title: 'Database',
    description: 'SQLite with 14 field types & dual-DB architecture',
  },
  {
    icon: Shield,
    title: 'Authentication',
    description: 'Email/Password, OAuth2, OTP, MFA/TOTP built-in',
  },
  {
    icon: Sparkles,
    title: 'AI Tools',
    description: 'Schema gen, rule gen, data seeder, chat assistant',
  },
  {
    icon: Search,
    title: 'Vector Search',
    description: 'Cosine similarity search — semantic queries in SQL',
  },
  {
    icon: Radio,
    title: 'Realtime',
    description: 'SSE + WebSocket with per-channel subscriptions',
  },
  {
    icon: FolderOpen,
    title: 'File Storage',
    description: 'Local & S3-compatible with protected file tokens',
  },
]

const comparisonRows = [
  { feature: 'Language', pocketbase: 'Go', tspoonbase: 'TypeScript' },
  { feature: 'Runtime', pocketbase: 'Single binary', tspoonbase: 'Node.js / Bun' },
  { feature: 'Database', pocketbase: 'SQLite', tspoonbase: 'SQLite (dual-DB ready)' },
  { feature: 'Auth methods', pocketbase: 'Email, OAuth2', tspoonbase: 'Email, OAuth2, OTP, MFA/TOTP' },
  { feature: 'AI Tools', pocketbase: '—', tspoonbase: 'Schema, Rule, Seeder, Chat' },
  { feature: 'Vector Search', pocketbase: '—', tspoonbase: 'Cosine similarity' },
  { feature: 'Realtime', pocketbase: 'WebSocket', tspoonbase: 'WebSocket + SSE' },
  { feature: 'File Storage', pocketbase: 'Local', tspoonbase: 'Local + S3' },
  { feature: 'Docker', pocketbase: 'Official image', tspoonbase: 'Official image' },
  { feature: 'Type Safety', pocketbase: 'Partial', tspoonbase: 'End-to-end' },
]

const installTabs = [
  {
    id: 'global-cli',
    label: 'Global CLI',
    code: `npm install -g tspoonbase
tspoonbase init my-project
cd my-project
tspoonbase serve --dev`,
    lang: 'bash' as const,
  },
  {
    id: 'programmatic',
    label: 'Programmatic',
    code: `import { createServer } from 'tspoonbase'

const app = createServer({
  port: 8090,
  dataDir: './pb_data',
})

app.start()`,
    lang: 'typescript' as const,
  },
  {
    id: 'docker',
    label: 'Docker',
    code: `docker run -p 8090:8090 \\
  -v $(pwd)/pb_data:/app/pb_data \\
  tspoonbase/tspoonbase:latest`,
    lang: 'bash' as const,
  },
]

function SpoonLogo({ className }: { className?: string }) {
  return (
    <img 
      src="/tspoonbase-logo.png" 
      alt="TspoonBase" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}

function InlineCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-theme-hover bg-theme-surface px-4 py-2.5 backdrop-blur-sm">
      <code className="text-sm text-theme-secondary">{text}</code>
      <button
        onClick={handleCopy}
        className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-theme-muted transition-colors hover:bg-theme-surface hover:text-theme-secondary"
        aria-label="Copy install command"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState(installTabs[0].id)
  const activeInstall = installTabs.find((t) => t.id === activeTab)!

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://tspoonbase.dev'
  const ogImage = `${siteUrl}/og-image.png`

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>TspoonBase — TypeScript Backend-as-a-Service</title>
        <meta name="description" content="TspoonBase is a TypeScript backend-as-a-service in a single package. SQLite, Express, WebSocket — with Auth, Realtime, File Storage, AI Tools, and Vector Search." />
        <meta property="og:title" content="TspoonBase — TypeScript Backend-as-a-Service" />
        <meta property="og:description" content="TspoonBase is a TypeScript backend-as-a-service in a single package." />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
          </div>

          {/* Floating decorative elements - Left side */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute left-[8%] top-[20%] animate-float-slow">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 backdrop-blur-sm">
                <Database className="h-7 w-7 text-primary/60" />
              </div>
            </div>
            <div className="absolute left-[5%] top-[45%] animate-float-medium">
              <div className="h-10 w-10 rotate-45 rounded-lg border border-primary/15 bg-primary/5 backdrop-blur-sm" />
            </div>
            <div className="absolute left-[12%] top-[65%] animate-float-fast">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm">
                <Shield className="h-6 w-6 text-primary/60" />
              </div>
            </div>
            <div className="absolute left-[3%] top-[80%] animate-float-slow">
              <div className="h-8 w-8 rounded-full border border-primary/15 bg-primary/5 backdrop-blur-sm" />
            </div>
            <div className="absolute left-[15%] top-[35%] animate-float-fast">
              <div className="h-6 w-6 rotate-12 rounded border border-primary/20 bg-primary/10 backdrop-blur-sm" />
            </div>
          </div>

          {/* Floating decorative elements - Right side */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute right-[8%] top-[18%] animate-float-medium">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm">
                <Zap className="h-7 w-7 text-primary/60" />
              </div>
            </div>
            <div className="absolute right-[5%] top-[40%] animate-float-slow">
              <div className="h-10 w-10 rotate-12 rounded-xl border border-primary/15 bg-primary/5 backdrop-blur-sm" />
            </div>
            <div className="absolute right-[10%] top-[60%] animate-float-fast">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 backdrop-blur-sm">
                <Server className="h-6 w-6 text-primary/60" />
              </div>
            </div>
            <div className="absolute right-[4%] top-[78%] animate-float-medium">
              <div className="h-8 w-8 rotate-45 rounded-lg border border-primary/15 bg-primary/5 backdrop-blur-sm" />
            </div>
            <div className="absolute right-[14%] top-[30%] animate-float-slow">
              <div className="h-6 w-6 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm" />
            </div>
            <div className="absolute right-[18%] top-[50%] animate-float-fast">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 backdrop-blur-sm">
                <Lock className="h-5 w-5 text-primary/50" />
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-center text-center">
              {/* Logo + Wordmark */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8 flex items-center gap-4"
              >
                <SpoonLogo className="h-14 w-14 animate-float" />
                <span className="font-heading text-3xl font-bold text-theme">
                  TspoonBase
                </span>
              </motion.div>

              {/* Tagline */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mb-4 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-tight text-theme sm:text-5xl md:text-6xl"
              >
                A TypeScript Backend-as-a-Service
                <span className="text-primary"> in a single package</span>
              </motion.h1>

              {/* Sub-tagline */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mb-10 max-w-2xl text-base text-theme-tertiary sm:text-lg"
              >
                SQLite · Express · WebSocket — Auth, Realtime, File Storage, AI Tools, Vector Search
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mb-6 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  to="/docs/getting-started/quick-start"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-theme shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-110"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://github.com/Jay-Suryawansh7/tspoonbase"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-theme-hover bg-theme-surface px-7 py-3 text-sm font-semibold text-theme backdrop-blur-sm transition-colors hover:bg-theme-muted"
                >
                  <Code className="h-4 w-4" />
                  View on GitHub
                </a>
              </motion.div>

              {/* Inline install command */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-16"
              >
                <InlineCopy text="npm install -g tspoonbase" />
              </motion.div>

              {/* Terminal */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="w-full max-w-2xl"
              >
                <Terminal
                  command="tspoonbase serve --dev --port 8090"
                  outputLines={[
                    '▸ Initializing TspoonBase v2.1.0...',
                    '✓ SQLite database connected (pb_data/data.db)',
                    '✓ WebSocket server ready',
                    '✓ SSE endpoint mounted',
                    '✓ Admin dashboard available at http://localhost:8090/_/',
                    '',
                    'Server running at http://0.0.0.0:8090',
                  ]}
                  typingSpeed={45}
                  lineDelay={350}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="border-t border-theme bg-theme-surface/30 py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <h2 className="mb-3 font-heading text-3xl font-bold text-theme">
                Everything you need
              </h2>
              <p className="mx-auto max-w-xl text-theme-tertiary">
                Batteries-included backend with auth, storage, AI, and realtime — no assembly required.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <FeatureCard
                  key={f.title}
                  icon={f.icon}
                  title={f.title}
                  description={f.description}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>

        {/* QUICK INSTALL */}
        <section className="border-t border-theme py-20">
          <div className="mx-auto max-w-4xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10 text-center"
            >
              <h2 className="mb-3 font-heading text-3xl font-bold text-theme">
                Quick Install
              </h2>
              <p className="mx-auto max-w-xl text-theme-tertiary">
                Get running in under 60 seconds. Choose your flavor.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Tabs */}
              <div className="mb-4 flex items-center gap-1 rounded-lg border border-theme bg-theme-surface p-1">
                {installTabs.map((tab) => (
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
                key={activeTab}
                code={activeInstall.code}
                lang={activeInstall.lang}
              />
            </motion.div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="border-t border-theme bg-theme-surface/30 py-20">
          <div className="mx-auto max-w-4xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10 text-center"
            >
              <h2 className="mb-3 font-heading text-3xl font-bold text-theme">
                How we compare
              </h2>
              <p className="mx-auto max-w-xl text-theme-tertiary">
                Familiar concepts from PocketBase, reimagined for the TypeScript ecosystem.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="overflow-hidden rounded-xl border border-theme"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-theme bg-theme-surface">
                    <th className="px-5 py-3.5 font-heading font-semibold text-theme-secondary">
                      Feature
                    </th>
                    <th className="px-5 py-3.5 font-heading font-semibold text-theme-secondary">
                      Go PocketBase
                    </th>
                    <th className="px-5 py-3.5 font-heading font-semibold text-primary">
                      TspoonBase
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={`transition-colors hover:bg-theme-muted ${
                        idx !== comparisonRows.length - 1 ? 'border-b border-theme' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-theme-secondary">
                        {row.feature}
                      </td>
                      <td className="px-5 py-3.5 text-theme-tertiary">
                        {row.pocketbase === '—' ? (
                          <span className="text-theme-muted">—</span>
                        ) : (
                          row.pocketbase
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-theme-secondary">
                        {row.tspoonbase === '—' ? (
                          <span className="text-theme-muted">—</span>
                        ) : row.tspoonbase.startsWith('✓') || row.tspoonbase === 'End-to-end' ? (
                          <span className="inline-flex items-center gap-1.5 text-primary">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {row.tspoonbase.replace('✓ ', '')}
                          </span>
                        ) : (
                          row.tspoonbase
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* ARCHITECTURE DIAGRAM */}
        <section className="border-t border-theme py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10 text-center"
            >
              <h2 className="mb-3 font-heading text-3xl font-bold text-theme">
                Architecture at a glance
              </h2>
              <p className="mx-auto max-w-xl text-theme-tertiary">
                One package. One process. Everything wired together.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <MermaidDiagram
                caption="TspoonBase high-level architecture"
                children={`flowchart TB
    subgraph Client
      A[Web App]
      B[Mobile App]
      C[Admin UI]
    end
    subgraph Server
      D[Express HTTP]
      E[Auth Middleware]
      F[API Rules]
      G[CRUD Handlers]
      H[Realtime Broker]
      I[JSVM Hooks]
    end
    subgraph Core
      J[Collections and Records]
      K[Schema Sync]
      L[Filter Engine]
      M[Migrations]
    end
    subgraph Storage
      N[(SQLite data.db)]
      O[(SQLite auxiliary.db)]
      P[Local Files]
      Q[S3 Bucket]
    end
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> J
    G --> H
    H --> A
    H --> B
    J --> K
    J --> L
    J --> M
    K --> N
    K --> O
    G --> P
    G --> Q
    I --> J
    style D fill:#0F9B76,color:#fff
    style N fill:#0F9B76,color:#fff`}
              />
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
