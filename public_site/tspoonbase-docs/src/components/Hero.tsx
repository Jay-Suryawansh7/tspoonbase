import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Database } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-4xl font-bold text-theme animate-float"
          >
            T
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 max-w-3xl font-heading text-5xl font-bold leading-tight tracking-tight text-theme md:text-6xl"
          >
            The TypeScript-native backend
            <span className="text-primary"> you actually want to use</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-10 max-w-2xl text-lg text-theme-secondary"
          >
            Tspoonbase gives you PocketBase superpowers with end-to-end type safety,
            real-time subscriptions, and a developer experience that feels like magic.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/docs/getting-started"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-theme transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-theme-hover px-6 py-3 font-medium text-theme transition-colors hover:bg-white/5"
            >
              Documentation
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3"
          >
            {[
              {
                icon: Zap,
                title: 'Type Safe',
                description: 'Generated types from your collections with zero config.',
              },
              {
                icon: Shield,
                title: 'Secure by Default',
                description: 'Auth, rules, and validations built in from day one.',
              },
              {
                icon: Database,
                title: 'Realtime',
                description: 'Subscribe to changes and keep your UI in sync.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-theme bg-theme-surface p-6 text-left"
              >
                <feature.icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="mb-2 font-heading font-semibold text-theme">
                  {feature.title}
                </h3>
                <p className="text-sm text-theme-tertiary">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
