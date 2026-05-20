'use client'

import { motion, type Variants } from 'framer-motion'

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function SettingsContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {children}
    </motion.div>
  )
}

export function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={card} whileHover={{ y: -1, transition: { duration: 0.15 } }} className={className}>
      {children}
    </motion.div>
  )
}

export function SettingsHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-10"
    >
      <h1 className="text-2xl font-bold text-gradient tracking-tight mb-1">{title}</h1>
      <p className="text-white/30 text-sm">{subtitle}</p>
    </motion.div>
  )
}
