import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import ProjectCard, { type Project } from '../components/ProjectCard'
import Footer from '../components/Footer'

/* ─── Abstract cover illustrations ─── */

function DevCollabCover() {
  return (
    <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F9B76" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0F9B76" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#dc-grad)" />
      {/* Nodes */}
      <circle cx="60" cy="60" r="8" fill="#0F9B76" opacity="0.5" />
      <circle cx="140" cy="40" r="6" fill="#0F9B76" opacity="0.4" />
      <circle cx="220" cy="80" r="10" fill="#0F9B76" opacity="0.35" />
      <circle cx="320" cy="50" r="7" fill="#0F9B76" opacity="0.45" />
      <circle cx="100" cy="120" r="5" fill="#0F9B76" opacity="0.3" />
      <circle cx="280" cy="130" r="8" fill="#0F9B76" opacity="0.4" />
      <circle cx="360" cy="100" r="6" fill="#0F9B76" opacity="0.35" />
      {/* Connections */}
      <line x1="60" y1="60" x2="140" y2="40" stroke="#0F9B76" strokeWidth="1.5" opacity="0.3" />
      <line x1="140" y1="40" x2="220" y2="80" stroke="#0F9B76" strokeWidth="1.5" opacity="0.25" />
      <line x1="220" y1="80" x2="320" y2="50" stroke="#0F9B76" strokeWidth="1.5" opacity="0.2" />
      <line x1="60" y1="60" x2="100" y2="120" stroke="#0F9B76" strokeWidth="1.5" opacity="0.2" />
      <line x1="220" y1="80" x2="280" y2="130" stroke="#0F9B76" strokeWidth="1.5" opacity="0.25" />
      <line x1="320" y1="50" x2="360" y2="100" stroke="#0F9B76" strokeWidth="1.5" opacity="0.2" />
      <line x1="100" y1="120" x2="280" y2="130" stroke="#0F9B76" strokeWidth="1" opacity="0.15" />
      {/* Pulse rings */}
      <circle cx="220" cy="80" r="18" stroke="#0F9B76" strokeWidth="1" fill="none" opacity="0.15" />
      <circle cx="220" cy="80" r="28" stroke="#0F9B76" strokeWidth="0.5" fill="none" opacity="0.1" />
    </svg>
  )
}

function NeuralHireCover() {
  return (
    <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="nh-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#nh-grad)" />
      {/* Neural nodes */}
      <circle cx="80" cy="50" r="6" fill="#F97316" opacity="0.5" />
      <circle cx="160" cy="40" r="5" fill="#F97316" opacity="0.4" />
      <circle cx="240" cy="55" r="7" fill="#F97316" opacity="0.45" />
      <circle cx="320" cy="45" r="6" fill="#F97316" opacity="0.4" />
      <circle cx="120" cy="100" r="5" fill="#8B5CF6" opacity="0.4" />
      <circle cx="200" cy="110" r="6" fill="#8B5CF6" opacity="0.5" />
      <circle cx="280" cy="95" r="5" fill="#8B5CF6" opacity="0.4" />
      <circle cx="360" cy="105" r="6" fill="#8B5CF6" opacity="0.35" />
      <circle cx="160" cy="150" r="5" fill="#F97316" opacity="0.3" />
      <circle cx="240" cy="145" r="6" fill="#8B5CF6" opacity="0.35" />
      {/* Connections */}
      <line x1="80" y1="50" x2="160" y2="40" stroke="#F97316" strokeWidth="1.5" opacity="0.25" />
      <line x1="160" y1="40" x2="240" y2="55" stroke="#F97316" strokeWidth="1.5" opacity="0.2" />
      <line x1="240" y1="55" x2="320" y2="45" stroke="#F97316" strokeWidth="1.5" opacity="0.15" />
      <line x1="80" y1="50" x2="120" y2="100" stroke="#F97316" strokeWidth="1" opacity="0.2" />
      <line x1="160" y1="40" x2="200" y2="110" stroke="#F97316" strokeWidth="1" opacity="0.15" />
      <line x1="240" y1="55" x2="280" y2="95" stroke="#F97316" strokeWidth="1" opacity="0.15" />
      <line x1="320" y1="45" x2="360" y2="105" stroke="#F97316" strokeWidth="1" opacity="0.1" />
      <line x1="120" y1="100" x2="200" y2="110" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.25" />
      <line x1="200" y1="110" x2="280" y2="95" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.2" />
      <line x1="280" y1="95" x2="360" y2="105" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.15" />
      <line x1="120" y1="100" x2="160" y2="150" stroke="#8B5CF6" strokeWidth="1" opacity="0.15" />
      <line x1="200" y1="110" x2="240" y2="145" stroke="#8B5CF6" strokeWidth="1" opacity="0.15" />
      <line x1="280" y1="95" x2="240" y2="145" stroke="#8B5CF6" strokeWidth="1" opacity="0.1" />
    </svg>
  )
}

function PixelVaultCover() {
  return (
    <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="pv-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#pv-grad)" />
      {/* Floating cubes */}
      <g opacity="0.5">
        <rect x="50" y="40" width="30" height="30" rx="4" fill="#3B82F6" opacity="0.3" />
        <rect x="55" y="35" width="30" height="30" rx="4" fill="#3B82F6" opacity="0.15" />
      </g>
      <g opacity="0.45">
        <rect x="130" y="60" width="24" height="24" rx="3" fill="#10B981" opacity="0.3" />
        <rect x="134" y="56" width="24" height="24" rx="3" fill="#10B981" opacity="0.15" />
      </g>
      <g opacity="0.5">
        <rect x="210" y="30" width="36" height="36" rx="5" fill="#3B82F6" opacity="0.25" />
        <rect x="216" y="24" width="36" height="36" rx="5" fill="#3B82F6" opacity="0.12" />
      </g>
      <g opacity="0.4">
        <rect x="300" y="50" width="28" height="28" rx="4" fill="#10B981" opacity="0.3" />
        <rect x="304" y="46" width="28" height="28" rx="4" fill="#10B981" opacity="0.15" />
      </g>
      <g opacity="0.35">
        <rect x="90" y="110" width="32" height="32" rx="4" fill="#3B82F6" opacity="0.25" />
        <rect x="94" y="106" width="32" height="32" rx="4" fill="#3B82F6" opacity="0.12" />
      </g>
      <g opacity="0.45">
        <rect x="180" y="120" width="26" height="26" rx="3" fill="#10B981" opacity="0.3" />
        <rect x="184" y="116" width="26" height="26" rx="3" fill="#10B981" opacity="0.15" />
      </g>
      <g opacity="0.4">
        <rect x="270" y="105" width="30" height="30" rx="4" fill="#3B82F6" opacity="0.25" />
        <rect x="274" y="101" width="30" height="30" rx="4" fill="#3B82F6" opacity="0.12" />
      </g>
      <g opacity="0.35">
        <rect x="340" y="125" width="24" height="24" rx="3" fill="#10B981" opacity="0.3" />
        <rect x="344" y="121" width="24" height="24" rx="3" fill="#10B981" opacity="0.15" />
      </g>
      {/* Connecting particles */}
      <circle cx="200" cy="90" r="3" fill="#3B82F6" opacity="0.4" />
      <circle cx="200" cy="90" r="8" stroke="#3B82F6" strokeWidth="0.5" fill="none" opacity="0.15" />
    </svg>
  )
}

/* ─── Project data ─── */

const projects: Project[] = [
  {
    slug: 'devcollab',
    name: 'DevCollab',
    tagline: 'Real-time collaborative dev knowledge base',
    description:
      'Build a live knowledge-sharing platform where developers co-edit docs, vote on solutions, and chat in real-time. Stress-tests Auth, Realtime, and File Storage.',
    difficulty: 'Intermediate',
    features: [
      { name: 'Auth', color: 'teal' },
      { name: 'Realtime', color: 'blue' },
      { name: 'File Storage', color: 'green' },
    ],
    cover: <DevCollabCover />,
  },
  {
    slug: 'neuralhire',
    name: 'NeuralHire',
    tagline: 'AI-powered recruitment platform',
    description:
      'An intelligent hiring assistant that parses resumes, scores candidates with vector similarity, and automates outreach. Exercises AI, Vector Search, and Migrations.',
    difficulty: 'Advanced',
    features: [
      { name: 'AI', color: 'orange' },
      { name: 'Vector Search', color: 'purple' },
      { name: 'Migrations', color: 'red' },
    ],
    cover: <NeuralHireCover />,
  },
  {
    slug: 'pixelvault',
    name: 'PixelVault',
    tagline: 'Multiplayer game asset marketplace',
    description:
      'A marketplace for game assets with real-time bidding, live previews, and collaborative rooms. Pushes Realtime, File Storage, and Auth to the limit.',
    difficulty: 'Advanced',
    features: [
      { name: 'Auth', color: 'teal' },
      { name: 'Realtime', color: 'blue' },
      { name: 'File Storage', color: 'green' },
    ],
    cover: <PixelVaultCover />,
  },
]

export default function Projects() {
  return (
    <>
      <Helmet>
        <title>Projects — TspoonBase</title>
        <meta
          name="description"
          content="Real-world projects built with TspoonBase — stress-testing auth, realtime, AI, vector search, file storage, and more."
        />
      </Helmet>

      <div className="min-h-screen bg-theme-body pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-theme">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary blur-3xl" />
            <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-accent blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="font-heading text-4xl font-bold tracking-tight text-theme sm:text-5xl">
                Built with TspoonBase
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-theme-tertiary">
                Real-world projects stress-testing every capability — auth, realtime, AI, vector
                search, file storage, and more.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Project Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <ProjectCard key={project.slug} project={project} index={i} />
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Footer />
        </div>
      </div>
    </>
  )
}
