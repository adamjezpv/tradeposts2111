'use client'

import { motion, type Variants } from 'framer-motion'

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function LocationCardWrapper({ children, index: _index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      variants={cardVariant}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      {children}
    </motion.div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
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

export function EmptyStateAnimated({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
    >
      {children}
    </motion.div>
  )
}
