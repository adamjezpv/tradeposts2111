'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion, type Variants } from 'framer-motion'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="8" y="0.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="0.5" y="8" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
        <rect x="8" y="8" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    href: '/locations',
    label: 'Locations',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="5.5" r="2" stroke="currentColor" strokeOpacity="0.6" />
        <path d="M7 13C7 13 2 9 2 5.5C2 2.91 4.24 1 7 1C9.76 1 12 2.91 12 5.5C12 9 7 13 7 13Z" stroke="currentColor" strokeOpacity="0.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/posts',
    label: 'Posts',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="3" y1="4.5" x2="11" y2="4.5" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeOpacity="0.6" />
        <line x1="3" y1="9.5" x2="8" y2="9.5" stroke="currentColor" strokeOpacity="0.6" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeOpacity="0.6" />
        <path d="M7 1V2.5M7 11.5V13M1 7H2.5M11.5 7H13M2.93 2.93L3.99 3.99M10.01 10.01L11.07 11.07M11.07 2.93L10.01 3.99M3.99 10.01L2.93 11.07" stroke="currentColor" strokeOpacity="0.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Sidebar({ userEmail, plan }: { userEmail: string; plan: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-[220px] flex-shrink-0 h-full flex flex-col border-r border-white/[0.07] bg-black"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center gap-2 px-5 py-5 border-b border-white/[0.05]"
      >
        <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
          <div className="w-3 h-3 rounded-sm bg-black" />
        </div>
        <span className="font-semibold text-white tracking-tight text-sm">TradePosts</span>
        <span className="text-white/25 text-xs">.io</span>
      </motion.div>

      {/* Nav */}
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 px-3 py-4 space-y-0.5"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative overflow-hidden group ${
                  isActive
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
                }`}
              >
                <span className={`transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-white/70' : 'text-white/30'}`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white/[0.08] rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Upgrade prompt for trial users */}
      {plan === 'trial' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.25 }}
          className="px-3 pb-3"
        >
          <Link
            href="/upgrade"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
              pathname === '/upgrade'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06] border border-white/[0.08]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
              <path d="M7 1L9 5H13L10 8L11 12L7 10L3 12L4 8L1 5H5L7 1Z" stroke="currentColor" strokeOpacity="0.6" strokeLinejoin="round" />
            </svg>
            <span className="flex-1">Upgrade</span>
            <span className="text-[9px] text-white/30 font-medium">from $19</span>
          </Link>
        </motion.div>
      )}

      {/* User section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="px-3 pb-4 border-t border-white/[0.05] pt-4"
      >
        <div className="px-3 py-1.5 mb-1">
          <p className="text-white/25 text-xs truncate leading-relaxed">{userEmail}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-1 h-1 rounded-full ${plan === 'trial' ? 'bg-white/25 animate-pulse' : 'bg-white/50'}`} />
            <span className="text-white/20 text-[10px] capitalize">{plan === 'trial' ? 'Free trial' : plan}</span>
          </div>
        </div>
        <motion.button
          onClick={handleSignOut}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/25 hover:text-white/55 hover:bg-white/[0.04] transition-all duration-150 text-left"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 1H2C1.45 1 1 1.45 1 2V12C1 12.55 1.45 13 2 13H5" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round" />
            <path d="M10 10L13 7L10 4" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="13" y1="7" x2="5" y2="7" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round" />
          </svg>
          Sign out
        </motion.button>
      </motion.div>
    </motion.aside>
  )
}
